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
PAGES          = 475               # print PDF page count — update when final
IN_PER_PAGE    = 0.00225           # BookBaby 50# white — VERIFY on their spec
SPINE          = round(PAGES * IN_PER_PAGE, 3)   # 0.713" at 317 pp
DPI            = 300               # SVG user units are inches * DPI

IMG            = '../../../assets/img/calendar-usurper-hero.jpg'
IMG_W, IMG_H   = 1376, 768         # source pixels (NOTE: ~106 DPI at this
                                   # scale — regenerate hi-res before upload)
WRAP_IMG       = '../../../assets/img/calendar-usurper-wrap.jpg'
WRAP_IMG_W, WRAP_IMG_H = 5186, 3700   # expand_image.py output: 1:1 with the wrap
SUMMIT_IMG     = 'symbol-cover-4x.png'   # upscaled 3.23x + watermark removed (2026-07-08)
SUMMIT_W, SUMMIT_H = 10240, 4344      # ~430 DPI at the paperback display size
SUMMIT_REF_H   = 1344.0               # the orb/title anchor constants (1650, 2370,
                                      # 1861.3, ...) are px in the ORIGINAL 3168x1344
                                      # frame; divide by (SUMMIT_REF_H / disp_h)

ISBN13   = "9781736521168"          # 978-1-7365211-6-8 — drives the back-cover EAN-13
TITLE_1  = "The Bible's"
TITLE_2  = "Symbolic Language"
AUTHOR   = "Daniel Larimer"
SPINE_TXT= "THE BIBLE\u2019S SYMBOLIC LANGUAGE  \u00b7  DANIEL LARIMER"
BACK_COPY = [
    ("\u201cI fed you with ^milk^ and not with ^meat^;", "ci"),
    ("for until now you were not able to receive it,", "ci"),
    ("and even now you are still not able.\u201d", "ci"),
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
    ("fresh meat on your own. With more than 140 symbols", ""),
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
    # x=-4.54: the eclipse and the full moon sit equidistant (~0.36in) from
    # the front panel's trim edges (author's ruling — neither orb cut).
    'summit-meat': dict(explicit=dict(img='SUMMIT', disp_h=9.85, x=-4.54, y=0.0),
                        meat_layout=True, title_cx=9.10),
}

TEXT_SHADOW = 'style="filter:url(#softshadow)"'

# ---------------- shared layer emitters ----------------
# Extracted so the BookBaby hardcover artifacts (case + dust jacket) reuse the
# approved summit-meat design. k scales the front lockup with the painting
# (k = disp_h / 9.85, the paperback display height); k=1 reproduces the
# paperback byte-for-byte.

def emit_meat_front(svg, u, tcx, k=1.0, face_cx=None, tagline_y=8.62, y_off=0.0):
    GOLD, CREAM = '#eda820', '#f2ead6'
    svg.append(f'<g id="layer-front-title" font-family="Noto Serif" font-weight="bold" text-anchor="middle" {TEXT_SHADOW}>')
    # MEAT — the symbol: gold ITALIC (the book's register for a term under study)
    svg.append(f'  <text x="{u(tcx)}" y="{u((4.05*k + y_off)/1.18)}" font-size="{u(1.02*k)}" transform="scale(1,1.18)" '
               f'fill="{GOLD}" font-style="italic" textLength="{u(3.35*k)}" lengthAdjust="spacingAndGlyphs">MEAT</text>')
    # underline — italic alone under-signals the symbol register at this size
    svg.append(f'  <rect x="{u(tcx - 3.35*k/2)}" y="{u(4.19*k + y_off)}" width="{u(3.35*k)}" height="{u(0.042*k)}" fill="{GOLD}"/>')
    # the interleaved subtitle: cream/gold/cream
    for i, (line, col) in enumerate([("THE BIBLE\u2019S", CREAM), ("SYMBOLIC", GOLD), ("LANGUAGE", CREAM)]):
        yy = ((4.78 + i * 0.60) * k + y_off) / 1.22
        svg.append(f'  <text x="{u(tcx)}" y="{u(yy)}" font-size="{u(0.52*k)}" transform="scale(1,1.22)" '
                   f'fill="{col}" textLength="{u(3.25*k)}" lengthAdjust="spacingAndGlyphs">{line}</text>')
    # closing rule — same stroke as the MEAT underline: the two gold bars
    # bracket THE BIBLE'S SYMBOLIC LANGUAGE into one lockup, author beneath
    svg.append(f'  <rect x="{u(tcx - 3.35*k/2)}" y="{u(6.12*k + y_off)}" width="{u(3.35*k)}" height="{u(0.042*k)}" fill="{GOLD}"/>')
    svg.append(f'  <text x="{u(tcx)}" y="{u(6.60*k + y_off)}" font-size="{u(0.22*k)}" fill="{GOLD}" '
               f'letter-spacing="{u(0.025*k)}">{AUTHOR.upper()}</text>')
    # small elegant line at the foot of the front panel
    svg.append(f'  <text x="{u(face_cx if face_cx is not None else FRONT_CX)}" y="{u(tagline_y)}" font-size="{u(0.16*k)}" fill="{CREAM}" '
               f'font-style="italic" font-weight="normal" letter-spacing="{u(0.02*k)}">Over 140 symbols revealed</text>')
    svg.append('</g>')

def emit_meat_spine(svg, u, scx, center_y, foot_y, sfs):
    GOLD, CREAM = '#eda820', '#f2ead6'
    svg.append(f'<g id="layer-spine" {TEXT_SHADOW}>')
    # title alone in the rotated run — MEAT gold italic, the rest cream
    svg.append(f'  <text x="{u(scx)}" y="{u(center_y)}" font-size="{u(sfs)}" '
               f'font-family="Noto Serif" letter-spacing="{u(0.018)}" '
               f'text-anchor="middle" dominant-baseline="central" '
               f'transform="rotate(90 {u(scx)} {u(center_y)})">'
               f'<tspan fill="{CREAM}" font-style="italic" font-weight="bold">MEAT</tspan>'
               f'<tspan fill="{CREAM}">\u2002THE BIBLE\u2019S SYMBOLIC LANGUAGE</tspan></text>')
    # author: two small horizontal lines at the spine foot (reads upright on the shelf)
    svg.append(f'  <text x="{u(scx)}" y="{u(foot_y)}" font-size="{u(0.115)}" fill="{CREAM}" '
               f'font-family="Noto Serif" text-anchor="middle" letter-spacing="{u(0.008)}">DANIEL</text>')
    svg.append(f'  <text x="{u(scx)}" y="{u(foot_y + 0.20)}" font-size="{u(0.115)}" fill="{CREAM}" '
               f'font-family="Noto Serif" text-anchor="middle" letter-spacing="{u(0.008)}">LARIMER</text>')
    svg.append('</g>')

def emit_back_copy(svg, u, x0, y0):
    svg.append(f'<g id="layer-back-copy" fill="#f0ebdd" font-family="Noto Serif" font-size="{u(0.20)}" {TEXT_SHADOW}>')
    MEASURE = 4.9                      # justified line length (in)
    yy = y0                            # line cursor: blanks advance a slim
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
            svg.append(f'  <text x="{u(x0 + MEASURE / 2)}" y="{u(yy)}" '
                       f'text-anchor="middle"{attrs}>{rendered}</text>')
        else:
            it = ' font-style="italic"' if style == 'i' else ''
            just = '' if (style == 'i' or para_end) else f' textLength="{u(MEASURE)}" lengthAdjust="spacing"'
            svg.append(f'  <text x="{u(x0)}" y="{u(yy)}"{it}{just}>{rendered}</text>')
        yy += 0.33
    svg.append('</g>')

def emit_hebrews(svg, u, heb_cx, hy):
    svg.append(f'<g id="layer-back-hebrews" fill="#f0ebdd" font-family="Noto Serif" {TEXT_SHADOW}>')
    for line, style in [("\u201cFor everyone who partakes", 'ci'),
                        ("only of ^milk^ is unskilled in the", 'ci'),
                        ("word of righteousness,", 'ci'),
                        ("for he is a babe.\u201d", 'ci'),
                        ("Hebrews 5:13", 'cc')]:
        rendered = re.sub(r'\^([^^]+)\^', r'<tspan fill="#eda820" font-style="italic">\1</tspan>', line)
        attrs = (f' font-style="italic" font-size="{u(0.18)}"' if style == 'ci'
                 else f' font-size="{u(0.15)}"')
        svg.append(f'  <text x="{u(heb_cx)}" y="{u(hy)}" text-anchor="middle"{attrs}>{rendered}</text>')
        hy += 0.26
    svg.append('</g>')

def emit_barcode(svg, u, bz_x, bz_y):
    # Bookland EAN-13 rendered from ISBN13 (pure black on the white zone;
    # guard bars descend; human-readable lines above/below)
    bz_w, bz_h = 2.0, 1.2
    Lc = {0:'0001101',1:'0011001',2:'0010011',3:'0111101',4:'0100011',5:'0110001',6:'0101111',7:'0111011',8:'0110111',9:'0001011'}
    Gc = {0:'0100111',1:'0110011',2:'0011011',3:'0100001',4:'0011101',5:'0111001',6:'0000101',7:'0010001',8:'0001001',9:'0010111'}
    Rc = {0:'1110010',1:'1100110',2:'1101100',3:'1000010',4:'1011100',5:'1001110',6:'1010000',7:'1000100',8:'1001000',9:'1110100'}
    PAR = {0:'LLLLLL',1:'LLGLGG',2:'LLGGLG',3:'LLGGGL',4:'LGLLGG',5:'LGGLLG',6:'LGGGLL',7:'LGLGLG',8:'LGLGGL',9:'LGGLGL'}
    dg = [int(c) for c in ISBN13]
    assert (10 - (sum(dg[i] for i in range(0,12,2)) + 3*sum(dg[i] for i in range(1,12,2))) % 10) % 10 == dg[12], 'ISBN check digit'
    mods = '101' + ''.join((Lc if PAR[dg[0]][i]=='L' else Gc)[d] for i, d in enumerate(dg[1:7])) \
         + '01010' + ''.join(Rc[d] for d in dg[7:13]) + '101'
    assert len(mods) == 95
    module = 0.0130                       # in — 100% EAN magnification
    bars_w = 95 * module
    bx0 = bz_x + (bz_w - bars_w) / 2
    by0 = bz_y + 0.30
    bar_h, guard_extra = 0.62, 0.08
    guard = set(range(0,3)) | set(range(45,50)) | set(range(92,95))
    svg.append(f'<g id="layer-barcode">')
    svg.append(f'  <rect x="{u(bz_x)}" y="{u(bz_y)}" width="{u(bz_w)}" height="{u(bz_h)}" fill="#f2ead6" rx="{u(0.06)}"/>')
    svg.append(f'  <text x="{u(bz_x + bz_w/2)}" y="{u(bz_y + 0.21)}" text-anchor="middle" '
               f'font-family="Noto Serif" font-size="{u(0.115)}" fill="#000000">ISBN 978-1-7365211-6-8</text>')
    run = None
    for i, m in enumerate(mods + '0'):
        if m == '1' and run is None: run = i
        if m == '0' and run is not None:
            bh = bar_h + (guard_extra if run in guard else 0)
            svg.append(f'  <rect x="{u(bx0 + run*module)}" y="{u(by0)}" width="{u((i-run)*module)}" height="{u(bh)}" fill="#000000"/>')
            run = None
    svg.append(f'  <text x="{u(bz_x + bz_w/2)}" y="{u(by0 + bar_h + guard_extra + 0.13)}" text-anchor="middle" '
               f'font-family="Noto Serif" font-size="{u(0.105)}" letter-spacing="{u(0.02)}" fill="#000000">9 781736 521168</text>')
    svg.append('</g>')

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
        emit_meat_front(svg, u, tcx)
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
    if p.get('meat_layout'):
        emit_meat_spine(svg, u, SPINE_CX, WRAP_H / 2, 8.30, sfs)
    else:
        svg.append(f'<g id="layer-spine" {text_shadow}>')
        svg.append(f'  <text x="{u(SPINE_CX)}" y="{u(WRAP_H/2)}" font-size="{u(sfs)}" fill="#f3e7c3" '
                   f'font-family="Noto Serif" letter-spacing="{u(0.018)}" '
                   f'text-anchor="middle" transform="rotate(90 {u(SPINE_CX)} {u(WRAP_H/2)})">{SPINE_TXT}</text>')
        svg.append('</g>')

    # --- layer: back copy (+ the Hebrews 5:13 block beside the barcode zone)
    emit_back_copy(svg, u, BACK_X0 + 0.55, 1.05 + BLEED)
    emit_hebrews(svg, u, (BACK_X0 + 0.55 + 3.75) / 2, 7.78)

    # --- layer: barcode (shared EAN-13 renderer)
    emit_barcode(svg, u, BACK_X1 - 2.0 - 0.375, BLEED + TRIM_H - 1.2 - 0.375)

    # --- layer: guides (delete or hide before upload; --final omits)
    if not FINAL:
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

# ================= BookBaby HARDCOVER artifacts =================
# Geometry read from BookBaby's own templates (Downloads, 2026-07-08), which
# are generated for THIS quote: 476pp on Natural 420 PPI. All numbers below
# are the template guide lines in points / 72. The paperback IN_PER_PAGE
# spine math above does NOT apply to the hardcover.
#
#   US-Trade-Hard-Cover.pdf  (printed case): 1083.53 x 756 pt
#     0.625in wrap | back board 6.25 | spine ~1.295 | front board 6.25 | wrap
#     boards y [0.639, 9.875]; crimp keep-free zones 0.61in inside each fold
#   US-Trade-DustJacket.pdf: 1551.53 x 684 pt, 0.125in bleed
#     flap 3.625 | back 6.375 | spine 1.306 | front 6.375 | flap 3.625
#     keep-free: 0.5in panel-side of flap folds, 0.25in beside spine folds

def _svg_scaffold(w_in, h_in, img_x, img_disp_h, comment, img_y=0.0, mirror_v=False):
    u = lambda v: round(v * DPI, 1)
    disp_w = img_disp_h * (SUMMIT_W / SUMMIT_H)
    svg = []
    svg.append(f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
               f'width="{w_in}in" height="{h_in}in" viewBox="0 0 {u(w_in)} {u(h_in)}" '
               f'font-family="{FONT}">')
    svg.append(f'<!-- {comment} -->')
    svg.append(f"""<style>
@font-face {{ font-family: "Noto Serif"; src: url("file://{NOTO_DIR}/notoserif-regular-subset.ttf"); }}
@font-face {{ font-family: "Noto Serif"; font-style: italic; src: url("file://{NOTO_DIR}/notoserif-italic-subset.ttf"); }}
</style>""")
    svg.append("""<defs>
  <filter id="softshadow" x="-30%" y="-30%" width="160%" height="160%">
    <feDropShadow dx="0" dy="0" stdDeviation="12" flood-color="#000" flood-opacity="0.9"/>
    <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.9"/>
  </filter>
  <linearGradient id="backfill" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#0a0e1c"/><stop offset="100%" stop-color="#101830"/>
  </linearGradient>
</defs>""")
    svg.append(f'<g id="layer-basefill"><rect width="{u(w_in)}" height="{u(h_in)}" fill="url(#backfill)"/></g>')
    svg.append(f'<g id="layer-background"><!-- swap href for the hi-res regeneration; keep x/y/width/height -->')
    if mirror_v:
        # art edge-to-edge: the bands above/below the placed image are its own
        # mirror (pixel-continuous at the fold seams; they land on the turn-in)
        for axis_y in (img_y, img_y + img_disp_h):
            svg.append(f'  <image xlink:href="{SUMMIT_IMG}" x="{u(img_x)}" y="{u(img_y)}" width="{u(disp_w)}" height="{u(img_disp_h)}" '
                       f'preserveAspectRatio="xMidYMid slice" transform="translate(0,{u(2 * axis_y)}) scale(1,-1)"/>')
    svg.append(f'  <image xlink:href="{SUMMIT_IMG}" x="{u(img_x)}" y="{u(img_y)}" width="{u(disp_w)}" height="{u(img_disp_h)}" '
               f'preserveAspectRatio="xMidYMid slice"/></g>')
    return svg, u

FLAP_TTB = [
    ("TIMETESTED.BIBLE", 'hlogo'),
    ("", ''),
    ("The book ends; the study doesn\u2019t.", ''),
    ("", ''),
    ("An interactive edition of this book", 'j'),
    ("lives at TimeTested.Bible \u2014 every", 'j'),
    ("quote and citation linked straight to", 'j'),
    ("the Scriptures, with complete", 'j'),
    ("interlinear tools to help you move", 'j'),
    ("from ^milk^ to ^meat^.", ''),
    ("", ''),
    ("Pull every reference by key word, by the", 'j'),
    ("Hebrew or Greek beneath the English,", 'j'),
    ("and by concept \u2014 what once took a", 'j'),
    ("lifetime of concordance work now takes", 'j'),
    ("minutes.", ''),
    ("", ''),
    ("Download the ebook free, and have", 'j'),
    ("your friends and family ^meet^ the", 'j'),
    ("Bible\u2019s symbolic language.", ''),
    ("", ''),
    ("Take no man\u2019s word \u2014 verify.", 'i'),
]

QR_TTB = [  # HTTPS://TIMETESTED.BIBLE, v3 29x29, ECC H (qrcode lib, 2026-07-08)
    '11111110111100111000101111111',
    '10000010111101100110101000001',
    '10111010010100001010001011101',
    '10111010100110110001001011101',
    '10111010110111111111101011101',
    '10000010110110010110101000001',
    '11111110101010101010101111111',
    '00000000000100110001100000000',
    '00010010001001110101000111011',
    '11101101100010011001110011111',
    '01011010001100011000110001001',
    '10110101000001001010000110000',
    '01101110110110110101001110101',
    '10000001011011111100010010101',
    '01101110001011000101001010110',
    '11100000000000111101100010011',
    '00011011010111101011000011011',
    '00010000110100101111100000001',
    '10001011011110101110000011101',
    '00101001001001010000000111011',
    '10010011101010110000111111010',
    '00000000110010001000100010001',
    '11111110000000110101101010100',
    '10000010001010101011100010110',
    '10111010001011001101111110100',
    '10111010111110110111001011111',
    '10111010000011000101110111001',
    '10000010000001010011001110111',
    '11111110010001010110001110000',
]

def emit_qr(svg, u, cx, top, size_in=0.80):
    """Stylized QR: navy rounded modules on a cream panel (same palette as the
    lockup). ECC level H leaves styling headroom; quiet zone 4 modules."""
    NAVY, CREAM = '#101830', '#f2ead6'
    n = len(QR_TTB)
    mod = size_in / n
    quiet = 4 * mod
    px, py = cx - size_in / 2 - quiet, top
    panel = size_in + 2 * quiet
    svg.append(f'<g id="layer-flap-qr">')
    svg.append(f'  <rect x="{u(px)}" y="{u(py)}" width="{u(panel)}" height="{u(panel)}" fill="{CREAM}" rx="{u(0.06)}"/>')
    x0, y0 = px + quiet, py + quiet
    # finder patterns: solid rounded squares (7x7 corners)
    finders = [(0, 0), (n - 7, 0), (0, n - 7)]
    for fx, fy in finders:
        svg.append(f'  <rect x="{u(x0 + fx*mod)}" y="{u(y0 + fy*mod)}" width="{u(7*mod)}" height="{u(7*mod)}" fill="{NAVY}" rx="{u(1.75*mod)}"/>')
        svg.append(f'  <rect x="{u(x0 + (fx+1)*mod)}" y="{u(y0 + (fy+1)*mod)}" width="{u(5*mod)}" height="{u(5*mod)}" fill="{CREAM}" rx="{u(1.25*mod)}"/>')
        svg.append(f'  <rect x="{u(x0 + (fx+2)*mod)}" y="{u(y0 + (fy+2)*mod)}" width="{u(3*mod)}" height="{u(3*mod)}" fill="{NAVY}" rx="{u(0.9*mod)}"/>')
    in_finder = lambda r, c: any(fx <= c < fx+7 and fy <= r < fy+7 for fx, fy in finders)
    for r, row in enumerate(QR_TTB):
        for c, bit in enumerate(row):
            if bit == '1' and not in_finder(r, c):
                svg.append(f'  <circle cx="{u(x0 + (c+0.5)*mod)}" cy="{u(y0 + (r+0.5)*mod)}" r="{u(0.42*mod)}" fill="{NAVY}"/>')
    svg.append('</g>')

def emit_app_icon(svg, u, cx, top, size_in=0.52):
    """The TimeTested.Bible app tile (icons/icon.svg): full moon on a navy
    rounded square — inlined as vectors so the print render is resolution-free."""
    s = size_in
    x, y = cx - s / 2, top
    svg.append(f'<g id="layer-flap-appicon">')
    svg.append(f'  <defs><radialGradient id="ttbmoon" cx="50%" cy="50%" r="50%">'
               f'<stop offset="0%" stop-color="#fffef0"/><stop offset="70%" stop-color="#f5f5dc"/>'
               f'<stop offset="100%" stop-color="#e8e4c8"/></radialGradient>'
               f'<linearGradient id="ttbbg" x1="0" y1="0" x2="0" y2="1">'
               f'<stop offset="0%" stop-color="#1a3a5c"/><stop offset="100%" stop-color="#0d2840"/>'
               f'</linearGradient></defs>')
    svg.append(f'  <rect x="{u(x)}" y="{u(y)}" width="{u(s)}" height="{u(s)}" fill="url(#ttbbg)" rx="{u(s * 80 / 512)}"/>')
    for r, op in ((200, 0.1), (180, 0.1)):
        svg.append(f'  <circle cx="{u(cx)}" cy="{u(y + s/2)}" r="{u(s * r / 512)}" fill="#f5f5dc" opacity="{op}"/>')
    svg.append(f'  <circle cx="{u(cx)}" cy="{u(y + s/2)}" r="{u(s * 160 / 512)}" fill="url(#ttbmoon)"/>')
    for mx, my, mr, op in ((190, 200, 30, 0.4), (310, 280, 40, 0.35), (220, 320, 25, 0.3),
                           (280, 180, 18, 0.25), (340, 220, 15, 0.3), (180, 280, 20, 0.25)):
        svg.append(f'  <circle cx="{u(x + s * mx / 512)}" cy="{u(y + s * my / 512)}" r="{u(s * mr / 512)}" fill="#d8d4b8" opacity="{op}"/>')
    svg.append('</g>')

def emit_flap(svg, u, layer, x0, col_w, y0, lines, size=0.16, pitch=0.27):
    # justified block, centered in the flap column (author's ruling 2026-07-08)
    measure = 2.85
    xj = x0 + (col_w - measure) / 2
    cx = x0 + col_w / 2
    svg.append(f'<g id="{layer}" fill="#f0ebdd" font-family="Noto Serif" font-size="{u(size)}" {TEXT_SHADOW}>')
    yy = y0
    for line, style in lines:
        if style == 'hlogo':
            # app tile at half the flap width, wordmark beneath (author's
            # ruling 2026-07-08)
            icon_s = 1.60
            emit_app_icon(svg, u, cx, yy, size_in=icon_s)
            yy += icon_s + 0.40
            svg.append(f'  <text x="{u(cx)}" y="{u(yy)}" text-anchor="middle" fill="#eda820" '
                       f'letter-spacing="{u(0.03)}" font-size="{u(0.20)}">{line}</text>')
            yy += 0.44
            continue
        if not line:
            yy += 0.10
            continue
        rendered = re.sub(r'\^([^^]+)\^', r'<tspan fill="#eda820" font-style="italic">\1</tspan>', line)
        if style == 'h':
            svg.append(f'  <text x="{u(cx)}" y="{u(yy)}" text-anchor="middle" fill="#eda820" '
                       f'letter-spacing="{u(0.03)}" font-size="{u(0.20)}">{rendered}</text>')
            yy += 0.10
        elif style in ('ci', 'cc'):
            attrs = ' font-style="italic"' if style == 'ci' else f' font-size="{u(0.14)}"'
            svg.append(f'  <text x="{u(cx)}" y="{u(yy)}" text-anchor="middle"{attrs}>{rendered}</text>')
        elif style == 'j':
            svg.append(f'  <text x="{u(xj)}" y="{u(yy)}" textLength="{u(measure)}" lengthAdjust="spacing">{rendered}</text>')
        elif style == 'i':
            svg.append(f'  <text x="{u(cx)}" y="{u(yy)}" text-anchor="middle" font-style="italic">{rendered}</text>')
        else:
            svg.append(f'  <text x="{u(xj)}" y="{u(yy)}">{rendered}</text>')
        yy += pitch
    svg.append('</g>')
    return yy

FINAL = False   # --final: omit layer-guides (upload-ready artwork)

def _guides(svg, u, w_in, h_in, vxs, hys):
    if FINAL:
        return
    svg.append(f'<g id="layer-guides" stroke="#00e0ff" stroke-width="1" stroke-dasharray="8,6" opacity="0.6">')
    for gx in vxs:
        svg.append(f'  <line x1="{u(gx)}" y1="0" x2="{u(gx)}" y2="{u(h_in)}"/>')
    for gy in hys:
        svg.append(f'  <line x1="0" y1="{u(gy)}" x2="{u(w_in)}" y2="{u(gy)}"/>')
    svg.append('</g>')

def build_case():
    W, H = 1083.53 / 72, 10.5
    WRAPM = 0.625
    BB0, BB1 = WRAPM, 6.875                       # back board
    SP0, SP1 = 495.4 / 72, 588.6 / 72             # spine folds (template)
    FB0, FB1 = SP1, 1039 / 72                     # front board
    CR_L, CR_R = 451 / 72, 633 / 72               # crimp keep-free outer bounds
    BT, BB_Y = 46 / 72, 711 / 72                  # board top/bottom
    # The art covers the boards + 0.25in past each fold (the rest of the
    # 0.625 wrap is glued inside; the basefill gradient shows only on the
    # turn-in). Smaller than full-bleed, so the angel-and-moons subject
    # breathes: the eclipse clears the crimp groove entirely (author's
    # ruling 2026-07-08) and the title keeps its painting-anchored spot.
    disp_h = 9.74
    ppi = SUMMIT_REF_H / disp_h   # anchors are original-frame px
    img_y = (BT + BB_Y) / 2 - disp_h / 2
    # orbs centered between the CRIMP LINE and the trim — the template's own
    # sanctioned centering for the crimped case ("crimp line and trim line")
    face0, face1 = CR_R, FB1
    img_x = (face0 + face1) / 2 - (1650 + 2370) / 2 / ppi
    k = disp_h / 9.85
    svg, u = _svg_scaffold(W, H, img_x, disp_h,
        f'HARDCOVER CASE (BookBaby US-Trade-Hard-Cover template, 476pp/420ppi): wrap {WRAPM}in | back 6.25 | spine {SP1-SP0:.3f} | front 6.25 | wrap; jacketed — no barcode',
        img_y=img_y, mirror_v=True)
    tcx = max(1861.3 / ppi + img_x, CR_R + 3.35 * k / 2 + 0.05)
    emit_meat_front(svg, u, tcx, k=k, face_cx=(face0 + face1) / 2, tagline_y=9.35, y_off=img_y)
    emit_meat_spine(svg, u, (SP0 + SP1) / 2, (BT + BB_Y) / 2, BB_Y - 0.825, min(0.30, (SP1 - SP0) * 0.42))
    emit_back_copy(svg, u, 0.995, BT + 1.14)
    # no barcode on the case (the jacket carries it) — Hebrews centered on the
    # back board's lower band instead
    emit_hebrews(svg, u, (BB0 + CR_L) / 2, BB_Y - 0.375 - 1.2 + 0.23)
    _guides(svg, u, W, H, (WRAPM, CR_L, SP0, SP1, CR_R, FB1), (BT, BB_Y))
    out = 'cover-case-summit-meat.svg'
    open(out, 'w').write('\n'.join(svg) + '\n</svg>')
    print(f'{out}: case {W:.3f}x{H}in, spine {SP1-SP0:.3f}in, image h={disp_h}in at ({img_x:.3f},{img_y:.3f}), title cx={tcx:.3f}')

def emit_ttt_flap(svg, u, x0, col_w):
    """Back flap, mirroring the front: the TTT cover art up top (as the front
    flap leads with the app tile), byline under the subtitle, and John 21:25
    anchoring the foot (author's ruling 2026-07-08)."""
    GOLD, CREAM = '#eda820', '#f2ead6'
    cx = x0 + col_w / 2
    svg.append(f'<g id="layer-flap-ttt" fill="#f0ebdd" font-family="Noto Serif" {TEXT_SHADOW}>')
    # cover art with a hairline cream frame
    iw = 1.50
    ih = iw * 2156 / 1418
    ix, iy = cx - iw / 2, 0.58
    svg.append(f'  <image xlink:href="../ttt-cover-plate.jpg" x="{u(ix)}" y="{u(iy)}" '
               f'width="{u(iw)}" height="{u(ih)}"/>')
    svg.append(f'  <rect x="{u(ix)}" y="{u(iy)}" width="{u(iw)}" height="{u(ih)}" '
               f'fill="none" stroke="{CREAM}" stroke-opacity="0.55" stroke-width="{u(0.008)}"/>')
    yy = iy + ih + 0.38
    svg.append(f'  <text x="{u(cx)}" y="{u(yy)}" text-anchor="middle" font-weight="bold" '
               f'letter-spacing="{u(0.02)}" font-size="{u(0.20)}">TIME TESTED TRADITION</text>')
    yy += 0.30
    svg.append(f'  <text x="{u(cx)}" y="{u(yy)}" text-anchor="middle" font-style="italic" '
               f'fill="{GOLD}" font-size="{u(0.155)}">The Renewed Biblical Calendar</text>')
    yy += 0.27
    svg.append(f'  <text x="{u(cx)}" y="{u(yy)}" text-anchor="middle" font-style="italic" '
               f'font-size="{u(0.13)}" fill-opacity="0.9">by Daniel Larimer</text>')
    yy += 0.40
    # pitch: justified both edges (author's ruling 2026-07-08), final line ragged
    measure = 2.85
    xj = cx - measure / 2
    pitch_lines = ("~Time Tested Tradition~ does a deep dive",
                   "into history, testing every primary",
                   "source and calendar theory against the",
                   "sun, moon, and stars to prove the year",
                   "of the cross and timing of the appointed",
                   "feasts of the LORD. This is must read",
                   "^meat^ for those interested in testing",
                   "the tradition we have inherited from",
                   "our fathers.")
    for i, line in enumerate(pitch_lines):
        rendered = re.sub(r'\^([^^]+)\^', r'<tspan fill="#eda820" font-style="italic">\1</tspan>', line)
        rendered = re.sub(r'~([^~]+)~', r'<tspan font-style="italic">\1</tspan>', rendered)
        just = '' if i == len(pitch_lines) - 1 else f' textLength="{u(measure)}" lengthAdjust="spacing"'
        svg.append(f'  <text x="{u(xj)}" y="{u(yy)}" font-size="{u(0.15)}"{just}>{rendered}</text>')
        yy += 0.24
    yy += 0.14
    svg.append(f'  <text x="{u(cx)}" y="{u(yy)}" text-anchor="middle" font-style="italic" '
               f'font-size="{u(0.155)}">Read it free at TimeTested.Bible.</text>')
    # John 21:25 anchors the foot of the flap
    yy += 0.52
    for line in ("\u201cAnd there are also many other",
                 "things that Jesus did, which if",
                 "they were written one by one,",
                 "I suppose that even the world",
                 "itself could not contain the books",
                 "that would be written.\u201d"):
        svg.append(f'  <text x="{u(cx)}" y="{u(yy)}" text-anchor="middle" font-style="italic" '
                   f'font-size="{u(0.15)}">{line}</text>')
        yy += 0.24
    svg.append(f'  <text x="{u(cx)}" y="{u(yy)}" text-anchor="middle" font-size="{u(0.14)}">John 21:25</text>')
    svg.append('</g>')

def build_jacket():
    W, H = 1551.53 / 72, 9.5
    BLD = 0.125
    TRIM_T, TRIM_B = 10 / 72, 675 / 72
    FFOLD_L, FFOLD_R = 3.75, 1282 / 72            # flap folds
    SP0, SP1 = 10.125, 823 / 72                   # spine folds
    BP0, BP1 = FFOLD_L, SP0                       # back panel
    FP0, FP1 = SP1, FFOLD_R                       # front panel
    disp_h = 10.55
    ppi = SUMMIT_REF_H / disp_h   # anchors are original-frame px
    img_x = (FP0 + FP1) / 2 - (1650 + 2370) / 2 / ppi
    k = disp_h / 9.85
    svg, u = _svg_scaffold(W, H, img_x, disp_h,
        f'DUST JACKET (BookBaby US-Trade-DustJacket template, 476pp/420ppi): flap 3.625 | back 6.375 | spine {SP1-SP0:.3f} | front 6.375 | flap 3.625; bleed {BLD}in')
    tcx = max(1861.3 / ppi + img_x, (FP0 + 0.25) + 3.35 * k / 2 + 0.05)
    emit_meat_front(svg, u, tcx, k=k, face_cx=(FP0 + FP1) / 2, tagline_y=9.0)
    emit_meat_spine(svg, u, (SP0 + SP1) / 2, (TRIM_T + TRIM_B) / 2, TRIM_B - 0.825, min(0.30, (SP1 - SP0) * 0.42))
    emit_back_copy(svg, u, 4.6125, TRIM_T + 1.05)
    bz_x, bz_y = BP1 - 0.25 - 2.0, TRIM_B - 0.375 - 1.2
    emit_hebrews(svg, u, (4.6125 + bz_x) / 2, bz_y + 0.23)
    emit_barcode(svg, u, bz_x, bz_y)
    # flap columns: template text-safe zones. ONE text flap (author's ruling
    # 2026-07-08): the TimeTested.Bible pitch on the front flap; back flap
    # art-only.
    flap_end = emit_flap(svg, u, 'layer-flap-front', 18.056, 3.125, 0.60, FLAP_TTB, size=0.15, pitch=0.24)
    emit_qr(svg, u, (18.056 + 21.181) / 2, flap_end + 0.08, size_in=0.70)
    emit_ttt_flap(svg, u, 0.375, 3.125)
    _guides(svg, u, W, H, (BLD, FFOLD_L, SP0, SP1, FFOLD_R, W - BLD - 0.0), (TRIM_T, TRIM_B))
    out = 'cover-jacket-summit-meat.svg'
    open(out, 'w').write('\n'.join(svg) + '\n</svg>')
    print(f'{out}: jacket {W:.3f}x{H}in, spine {SP1-SP0:.3f}in, image h={disp_h}in at x={img_x:.3f}, title cx={tcx:.3f}')

if __name__ == '__main__':
    args = sys.argv[1:]
    if '--final' in args:
        FINAL = True
        args.remove('--final')
    names = args or list(PRESETS)
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    for n in names:
        if n == 'case':     build_case()
        elif n == 'jacket': build_jacket()
        else:               build(n)
