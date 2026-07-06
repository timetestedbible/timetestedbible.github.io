#!/usr/bin/env python3
"""Generate the BookBaby cover-wrap SVG for "The Bible's Symbolic Language".

The output SVG is LAYERED and hand-editable: every text element and the
background placement live in clearly-named groups (id="layer-...").  Edit
wording/positions directly in the SVG, or change the parameters below and
re-run to re-flow the geometry (e.g. when the page count — and so the
spine width — settles, or when a higher-resolution background is ready).

Layout presets answer the standing design question:
  front-angel : angel centered on the FRONT panel; eclipse + both moons on
                the front; the painting's left sky wraps across the spine
                to the back (a matched dark fill extends the far back edge).
  spine-angel : angel centered on the SPINE; the full moon and right wing
                carry the front; the eclipse lands on the back's top.
  front-orbs  : the eclipse and the full moon are both fully on the front
                (angel just left of front-center); the rest wraps back.

Usage:  python3 make_cover.py [preset ...]     (default: all three)
"""

import sys, os, re

# ---------------- parameters ----------------
TRIM_W, TRIM_H = 6.0, 9.0          # inches, trade paperback
BLEED          = 0.125             # BookBaby standard
PAGES          = 414               # print PDF page count — update when final
IN_PER_PAGE    = 0.00225           # BookBaby 50# white — VERIFY on their spec
SPINE          = round(PAGES * IN_PER_PAGE, 3)   # 0.713" at 317 pp
DPI            = 300               # SVG user units are inches * DPI

IMG            = '../../../assets/img/calendar-usurper-hero.jpg'
IMG_W, IMG_H   = 1376, 768         # source pixels (NOTE: ~106 DPI at this
                                   # scale — regenerate hi-res before upload)
WRAP_IMG       = '../../../assets/img/calendar-usurper-wrap.jpg'
WRAP_IMG_W, WRAP_IMG_H = 5186, 3700   # expand_image.py output: 1:1 with the wrap
SUMMIT_IMG     = '../../../assets/img/symbol-cover-background.png'
SUMMIT_W, SUMMIT_H = 3168, 1344       # ~136 DPI at display size — upscale before upload

TITLE_1  = "The Bible's"
TITLE_2  = "Symbolic Language"
AUTHOR   = "Daniel Larimer"
SPINE_TXT= "THE BIBLE\u2019S SYMBOLIC LANGUAGE  \u00b7  DANIEL LARIMER"
BACK_COPY = [
    ("\u201cI have fed you with ^milk^, and not with ^meat^:", "ci"),
    ("for hitherto ye were not able to bear it.\u201d", "ci"),
    ("1 Corinthians 3:2", "cc"),
    ("", ""),
    ("By this time you ought to be eating meat.", ""),
    ("", ""),
    ("The wise and faithful servant gives the household", ""),
    ("^\u201cmeat in due season,\u201d^ becomes a ~\u201csteward of the~", ""),
    ("~mysteries of God,\u201d~ and has his senses ~\u201cexercised~", ""),
    ("~to discern\u201d~ all parables. Would Jesus rebuke you", ""),
    ("as he did his disciples: ^\u201cKnow ye not this parable?^", ""),
    ("^and how then will ye know all parables?\u201d^", ""),
    ("", ""),
    ("This book feeds meat \u2014 not a closed set of mysteries", ""),
    ("explained, but lessons in how to seek and discover", ""),
    ("fresh meat on your own. With more than 120 symbols", ""),
    ("proved from Scripture\u2019s own cross-references, it", ""),
    ("brings the Bible to life.", ""),
    ("", ""),
    ("Come \u2014 meet the Bible\u2019s symbolic language.", "i"),
]
NOTO_DIR = "/Users/dlarimer/.gem/gems/asciidoctor-pdf-2.3.24/data/fonts"
FONT = "Noto Serif, Georgia, serif"

# wrap geometry (inches)
WRAP_W = BLEED + TRIM_W + SPINE + TRIM_W + BLEED
WRAP_H = BLEED + TRIM_H + BLEED
BACK_X0, BACK_X1   = BLEED, BLEED + TRIM_W            # back panel (left)
SPINE_X0, SPINE_X1 = BACK_X1, BACK_X1 + SPINE
FRONT_X0, FRONT_X1 = SPINE_X1, SPINE_X1 + TRIM_W      # front panel (right)
FRONT_CX = (FRONT_X0 + FRONT_X1) / 2
SPINE_CX = (SPINE_X0 + SPINE_X1) / 2

PRESETS = {
    # anchor: image-width fraction to pin at anchor_x; scale: extra zoom
    'front-angel': dict(anchor_frac=0.50, anchor_x=FRONT_CX, scale=1.00),
    'spine-angel': dict(anchor_frac=0.50, anchor_x=SPINE_CX, scale=1.00),
    'front-orbs':  dict(anchor_frac=0.56, anchor_x=FRONT_CX, scale=1.08),
    # expanded canvas (expand_image.py): 1:1 wrap mapping — wings entirely on
    # the front, mountain below the feet carries the title
    'front-wings': dict(wrap_image=True, title_y_frac=0.745),
    # summit painting (symbol-cover-background.png): scaled to 9.85in tall,
    # top-aligned — the watermark in the source's lower right falls BELOW the
    # bottom bleed edge; x chosen so the full moon clears the right trim.
    # Title block sits in the cloud sea, left of the angel.
    'summit': dict(explicit=dict(img='SUMMIT', disp_h=9.85, x=-4.9, y=0.0),
                   title_cx=8.75, title_y_frac=0.655),
    # A: title under the lifted arm over the chest, left of the full moon —
    # tall condensed caps, tight leading (book-cover treatment)
    'summit-chest': dict(explicit=dict(img='SUMMIT', disp_h=9.85, x=-4.9, y=0.0),
                         title_cx=9.25, title_y_abs=3.85, title_size=0.52, block_w=3.2,
                         title_vscale=1.28, title_pitch=1.04, rule_gap=0.20, author_gap=0.34),
    # B: centered, below the full moon — same tall-caps treatment, larger
    'summit-moon': dict(explicit=dict(img='SUMMIT', disp_h=9.85, x=-4.9, y=0.0),
                        title_cx=None, title_y_abs=6.75, title_size=0.624, block_w=4.5,
                        title_vscale=1.20, title_pitch=1.06, rule_gap=0.18, author_gap=0.32,
                        length_adjust='spacing'),
    # MEAT concept (author): the title enacts the book's convention — MEAT and
    # SYMBOLIC in symbol-gold, THE BIBLE'S / LANGUAGE in cream. Read the gold:
    # MEAT [is] SYMBOLIC; read the cream: THE BIBLE'S LANGUAGE. Spoken, the
    # title is the invitation: "meet the Bible's symbolic language."
    'summit-meat': dict(explicit=dict(img='SUMMIT', disp_h=9.85, x=-4.9, y=0.0),
                        meat_layout=True, title_cx=9.10),
}

def build(preset_name):
    p = PRESETS[preset_name]
    if p.get('explicit'):
        e = p['explicit']
        img = SUMMIT_IMG if e['img'] == 'SUMMIT' else e['img']
        h = e['disp_h']
        w = h * (SUMMIT_W / SUMMIT_H)
        x, y = e['x'], e['y']
    elif p.get('wrap_image'):
        img, x, y, w, h = WRAP_IMG, 0.0, 0.0, WRAP_W, WRAP_H
    else:
        img = IMG
        img_aspect = IMG_W / IMG_H
        h = WRAP_H * p['scale']             # image display height (in)
        w = h * img_aspect                  # image display width (in)
        x = p['anchor_x'] - p['anchor_frac'] * w
        y = (WRAP_H - h) / 2                # centre vertical crop
        # keep the eclipse corona: bias crop toward keeping the top
        if h > WRAP_H:
            y = 0.0

    u = lambda v: round(v * DPI, 1)         # inches -> user units

    text_shadow = 'style="filter:url(#softshadow)"'
    svg = []
    svg.append(f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
               f'width="{WRAP_W}in" height="{WRAP_H}in" viewBox="0 0 {u(WRAP_W)} {u(WRAP_H)}" '
               f'font-family="{FONT}">')
    svg.append(f'<!-- COVER WRAP: back | spine ({SPINE}in @ {PAGES}pp) | front; bleed {BLEED}in all round. -->')
    svg.append(f'<!-- Panels (user units @{DPI}/in): back {u(BACK_X0)}-{u(BACK_X1)}, spine {u(SPINE_X0)}-{u(SPINE_X1)}, front {u(FRONT_X0)}-{u(FRONT_X1)} -->')
    svg.append(f'''<style>
@font-face {{{{ font-family: "Noto Serif"; src: url("file://{NOTO_DIR}/notoserif-regular-subset.ttf"); }}}}
@font-face {{{{ font-family: "Noto Serif"; font-style: italic; src: url("file://{NOTO_DIR}/notoserif-italic-subset.ttf"); }}}}
</style>''')
    svg.append('''<defs>
  <filter id="softshadow" x="-30%" y="-30%" width="160%" height="160%">
    <feDropShadow dx="0" dy="0" stdDeviation="12" flood-color="#000" flood-opacity="0.9"/>
    <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.9"/>
  </filter>
  <linearGradient id="backfill" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#0a0e1c"/><stop offset="100%" stop-color="#101830"/>
  </linearGradient>
</defs>''')

    # --- layer: base fill (covers any gap the image leaves at the far back edge)
    svg.append(f'<g id="layer-basefill"><rect width="{u(WRAP_W)}" height="{u(WRAP_H)}" fill="url(#backfill)"/></g>')

    # --- layer: background painting
    svg.append(f'<g id="layer-background"><!-- swap href for the hi-res regeneration; keep x/y/width/height -->')
    svg.append(f'  <image xlink:href="{img}" x="{u(x)}" y="{u(y)}" width="{u(w)}" height="{u(h)}" '
               f'preserveAspectRatio="xMidYMid slice"/></g>')

    # --- layer: front title block — mirrors print/title-page.svg: three
    # all-caps lines stretched to one width (textLength), thin rule, byline.
    tsize   = p.get('title_size', 0.46)
    block_w = p.get('block_w', 2.9)     # width of the justified title block (in)
    line_h  = tsize * p.get('title_pitch', 1.35)   # baseline pitch of the lines
    if p.get('title_y_abs') is not None:
        ty = p['title_y_abs'] + BLEED
    else:
        ty = TRIM_H * p.get('title_y_frac', 0.715) + BLEED     # first baseline
    tcx = p.get('title_cx') or FRONT_CX
    if p.get('meat_layout'):
        GOLD, CREAM = '#eda820', '#f2ead6'
        svg.append(f'<g id="layer-front-title" font-family="Noto Serif" font-weight="bold" text-anchor="middle" {text_shadow}>')
        # MEAT — the symbol: gold ITALIC (the book's register for a term under study)
        svg.append(f'  <text x="{u(tcx)}" y="{u(4.05/1.18)}" font-size="{u(1.02)}" transform="scale(1,1.18)" '
                   f'fill="{GOLD}" font-style="italic" textLength="{u(3.35)}" lengthAdjust="spacingAndGlyphs">MEAT</text>')
        # underline — italic alone under-signals the symbol register at this size
        svg.append(f'  <rect x="{u(tcx - 3.35/2)}" y="{u(4.19)}" width="{u(3.35)}" height="{u(0.042)}" fill="{GOLD}"/>')
        # the interleaved subtitle: cream/gold/cream
        for i, (line, col) in enumerate([("THE BIBLE\u2019S", CREAM), ("SYMBOLIC", GOLD), ("LANGUAGE", CREAM)]):
            yy = (4.78 + i * 0.60) / 1.22
            svg.append(f'  <text x="{u(tcx)}" y="{u(yy)}" font-size="{u(0.52)}" transform="scale(1,1.22)" '
                       f'fill="{col}" textLength="{u(3.25)}" lengthAdjust="spacingAndGlyphs">{line}</text>')
        # closing rule — same stroke as the MEAT underline: the two gold bars
        # bracket THE BIBLE'S SYMBOLIC LANGUAGE into one lockup, author beneath
        svg.append(f'  <rect x="{u(tcx - 3.35/2)}" y="{u(6.12)}" width="{u(3.35)}" height="{u(0.042)}" fill="{GOLD}"/>')
        svg.append(f'  <text x="{u(tcx)}" y="{u(6.60)}" font-size="{u(0.22)}" fill="{GOLD}" '
                   f'letter-spacing="{u(0.025)}">{AUTHOR.upper()}</text>')
        # small elegant line at the foot of the front panel
        svg.append(f'  <text x="{u(FRONT_CX)}" y="{u(8.62)}" font-size="{u(0.16)}" fill="{CREAM}" '
                   f'font-style="italic" font-weight="normal" letter-spacing="{u(0.02)}">Over 120 symbols revealed</text>')
        svg.append('</g>')
    else:
        svg.append(f'<g id="layer-front-title" font-family="Noto Serif" fill="#f2ead6" text-anchor="middle" {text_shadow}>')
        vs = p.get('title_vscale', 1.0)     # tall book-cover caps: y-scale the lines
        for i, line in enumerate(("THE BIBLE\u2019S", "SYMBOLIC", "LANGUAGE")):
            yy = (ty + i*line_h) / vs
            svg.append(f'  <text x="{u(tcx)}" y="{u(yy)}" font-size="{u(tsize)}" transform="scale(1,{vs})" '
                       f'textLength="{u(block_w)}" lengthAdjust="{p.get("length_adjust", "spacingAndGlyphs")}">{line}</text>')
        ry = ty + 2*line_h + p.get('rule_gap', 0.28)
        svg.append(f'  <rect x="{u(tcx - 0.85)}" y="{u(ry)}" width="{u(1.7)}" height="{u(0.014)}" fill="#f2ead6"/>')
        svg.append(f'  <text x="{u(tcx)}" y="{u(ry + p.get("author_gap", 0.42))}" font-size="{u(0.20)}" letter-spacing="{u(0.02)}">{AUTHOR.upper()}</text>')
        svg.append('</g>')

    # --- layer: spine (reads top-to-bottom when the book stands upright)
    sfs = min(0.27, SPINE * 0.42)   # sized to the spine; glyph body stays well inside BookBaby's edge safety
    svg.append(f'<g id="layer-spine" {text_shadow}>')
    if p.get('meat_layout'):
        GOLD, CREAM = '#eda820', '#f2ead6'
        # title alone in the rotated run — MEAT gold italic, the rest cream
        tc = WRAP_H / 2                 # title centred on the spine (author sits at the foot)
        svg.append(f'  <text x="{u(SPINE_CX)}" y="{u(tc)}" font-size="{u(sfs)}" '
                   f'font-family="Noto Serif" letter-spacing="{u(0.018)}" '
                   f'text-anchor="middle" dominant-baseline="central" '
                   f'transform="rotate(90 {u(SPINE_CX)} {u(tc)})">'
                   f'<tspan fill="{CREAM}" font-style="italic" font-weight="bold">MEAT</tspan>'
                   f'<tspan fill="{CREAM}">\u2002THE BIBLE\u2019S SYMBOLIC LANGUAGE</tspan></text>')
        # author: two small horizontal lines at the spine foot (reads upright on the shelf)
        svg.append(f'  <text x="{u(SPINE_CX)}" y="{u(8.30)}" font-size="{u(0.115)}" fill="{CREAM}" '
                   f'font-family="Noto Serif" text-anchor="middle" letter-spacing="{u(0.008)}">DANIEL</text>')
        svg.append(f'  <text x="{u(SPINE_CX)}" y="{u(8.50)}" font-size="{u(0.115)}" fill="{CREAM}" '
                   f'font-family="Noto Serif" text-anchor="middle" letter-spacing="{u(0.008)}">LARIMER</text>')
    else:
        svg.append(f'  <text x="{u(SPINE_CX)}" y="{u(WRAP_H/2)}" font-size="{u(sfs)}" fill="#f3e7c3" '
                   f'font-family="Noto Serif" letter-spacing="{u(0.018)}" '
                   f'text-anchor="middle" transform="rotate(90 {u(SPINE_CX)} {u(WRAP_H/2)})">{SPINE_TXT}</text>')
    svg.append('</g>')

    # --- layer: back copy
    svg.append(f'<g id="layer-back-copy" fill="#f0ebdd" font-family="Noto Serif" font-size="{u(0.20)}" {text_shadow}>')
    by = 1.05 + BLEED
    MEASURE = 4.9                      # justified line length (in)
    yy = by                            # line cursor: blanks advance a slim
    for i, entry in enumerate(BACK_COPY):   # paragraph gap, not a full pitch
        line, style = entry if isinstance(entry, tuple) else (entry, '')
        if not line:
            yy += 0.20
            continue
        nxt = BACK_COPY[i + 1] if i + 1 < len(BACK_COPY) else ('', '')
        nxt_line = nxt[0] if isinstance(nxt, tuple) else nxt
        para_end = (nxt_line == '')
        rendered = re.sub(r'\^([^^]+)\^', r'<tspan fill="#eda820" font-style="italic">\1</tspan>', line)
        rendered = re.sub(r'~([^~]+)~', r'<tspan font-style="italic">\1</tspan>', rendered)
        if style in ('ci', 'cc'):
            # centered epigraph block, book-style: italic quote lines,
            # citation on its own line — smaller, roman (mirrors the
            # interior chapter-epigraph / chapter-epigraph-cite roles)
            attrs = ' font-style="italic"' if style == 'ci' else f' font-size="{u(0.16)}"'
            svg.append(f'  <text x="{u(BACK_X0 + 0.55 + MEASURE / 2)}" y="{u(yy)}" '
                       f'text-anchor="middle"{attrs}>{rendered}</text>')
        else:
            it = ' font-style="italic"' if style == 'i' else ''
            just = '' if (style == 'i' or para_end) else f' textLength="{u(MEASURE)}" lengthAdjust="spacing"'
            svg.append(f'  <text x="{u(BACK_X0 + 0.55)}" y="{u(yy)}"{it}{just}>{rendered}</text>')
        yy += 0.33
    # Hebrews 5:13 — its own centered block in the clear panel left of the
    # barcode zone, vertically aligned with the barcode
    heb_cx = (BACK_X0 + 0.55 + 3.75) / 2
    hy = 7.78
    for line, style in [("“For every one that useth ^milk^", 'ci'),
                        ("is unskilful in the word", 'ci'),
                        ("of righteousness.”", 'ci'),
                        ("Hebrews 5:13", 'cc')]:
        rendered = re.sub(r'\^([^^]+)\^', r'<tspan fill="#eda820" font-style="italic">\1</tspan>', line)
        attrs = (f' font-style="italic" font-size="{u(0.18)}"' if style == 'ci'
                 else f' font-size="{u(0.15)}"')
        svg.append(f'  <text x="{u(heb_cx)}" y="{u(hy)}" text-anchor="middle"{attrs}>{rendered}</text>')
        hy += 0.26
    svg.append('</g>')

    # --- layer: barcode zone (BookBaby drops the ISBN barcode here)
    bz_w, bz_h = 2.0, 1.2
    svg.append(f'<g id="layer-barcode-zone">')
    svg.append(f'  <rect x="{u(BACK_X1 - bz_w - 0.375)}" y="{u(BLEED + TRIM_H - bz_h - 0.375)}" '
               f'width="{u(bz_w)}" height="{u(bz_h)}" fill="#ffffff" rx="{u(0.04)}"/></g>')

    # --- layer: guides (delete or hide before upload)
    svg.append(f'<g id="layer-guides" stroke="#00e0ff" stroke-width="1" stroke-dasharray="8,6" opacity="0.6">')
    for gx in (BACK_X0, BACK_X1, SPINE_X1, FRONT_X1):
        svg.append(f'  <line x1="{u(gx)}" y1="0" x2="{u(gx)}" y2="{u(WRAP_H)}"/>')
    svg.append(f'  <line x1="0" y1="{u(BLEED)}" x2="{u(WRAP_W)}" y2="{u(BLEED)}"/>')
    svg.append(f'  <line x1="0" y1="{u(WRAP_H - BLEED)}" x2="{u(WRAP_W)}" y2="{u(WRAP_H - BLEED)}"/>')
    svg.append('</g>')
    svg.append('</svg>')

    out = f'cover-wrap-{preset_name}.svg'
    open(out, 'w').write('\n'.join(svg))
    print(f'{out}: wrap {WRAP_W:.3f}x{WRAP_H:.2f}in, spine {SPINE}in, image {w:.1f}x{h:.1f}in at x={x:.2f}')

if __name__ == '__main__':
    names = sys.argv[1:] or list(PRESETS)
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    for n in names:
        build(n)
