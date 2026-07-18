#!/usr/bin/env python3
"""Composite an etched inscription plaque onto DERIVED copies of the chapter
plates (author-approved recipe, 2026-07-11). Masters stay pristine — output
goes to images/plated/<same name>.jpg, which is gitignored.

Recipe:
  frame  images/plaque-frame.png, cropped to its alpha bbox, squashed to
         0.384x height, grayscaled keeping alpha
  field  the writable face = bright pixels (level > 200, alpha > 230);
         rows where > 40% of pixels are bright, cols where > 35%
  scale  plaque resized so its width = 0.66 x plate width
  title  fitted to 0.84 x field width, starting at 0.40 x field height and
         stepping -2; Baskerville (Baskerville.ttc index 1, fallback 0);
         tracking 0.12 x size
  cite   0.85 x title size; gap below title = 0.35 x title size
         + 0.5 x citation size
  draw   text block centered on the FIELD center both axes; engraved
         two-pass — highlight (252,252,250) at +1,+1 under ink (40,40,40)
  place  plaque positioned so the FIELD center-x sits on the plate
         center-x; bottom margin 0.02 x plate height

Print-toned twin set (--print): the plaque composited directly onto the
shipping images/print/<stem>.jpg plate (already tone-curved, authored at
the 6.25x9.25 BLEED aspect — extension.rb's prepress geometry), so the
plate pixels stay pixel-identical to what BookBaby already has. Two
adjustments keep the printed appearance identical to the color recipe:
  geometry  the plaque is sized and positioned against the 6x9 TRIM box
            inside the bleed (0.66 x trim width; bottom margin 0.02 x trim
            height above the trim bottom edge) — sizing against the bled
            page would land the plaque 0.06in from the trim line
  tone      the plaque graphic and the engraved text colors are passed
            through the plate's own print-tone LUT (tier A/B/C measured on
            the COLOR MASTER, exactly as print/plate-print-tone.py measures
            it), as if the plaque had been in the photograph before toning
Output goes to images/plated-print/<same name>.jpg (gitignored).

Run from books/symbolic-language/:
  python3 print/plate-plaques.py 02-sower 11-fish-stater
  python3 print/plate-plaques.py --all
  python3 print/plate-plaques.py --all --print
"""
import os
import re
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

Image.MAX_IMAGE_PIXELS = None

BOOK_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRAME_PATH = os.path.join(BOOK_DIR, 'images', 'plaque-frame.png')
CAPTIONS_PATH = os.path.join(BOOK_DIR, 'plate-captions.md')
MASTERS_DIR = os.path.join(BOOK_DIR, 'images', 'masters')
OUT_DIR = os.path.join(BOOK_DIR, 'images', 'plated')
PRINT_DIR = os.path.join(BOOK_DIR, 'images', 'print')
PRINT_OUT_DIR = os.path.join(BOOK_DIR, 'images', 'plated-print')
FONT_PATH = '/System/Library/Fonts/Supplemental/Baskerville.ttc'

HIGHLIGHT = (252, 252, 250)
INK = (40, 40, 40)

# Prepress plates carry 0.125in bleed on all sides of the 6x9 trim.
BLEED_TRIM_X = 0.125 / 6.25    # trim inset as a fraction of bled width
BLEED_TRIM_Y = 0.125 / 9.25    # trim inset as a fraction of bled height


def load_font(size):
    for index in (1, 0):
        try:
            return ImageFont.truetype(FONT_PATH, size, index=index)
        except OSError:
            continue
    raise SystemExit(f'cannot load Baskerville from {FONT_PATH}')


def read_captions():
    """Parse plate-captions.md table rows -> {stem: (inscription, citation)}."""
    rows = {}
    with open(CAPTIONS_PATH, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line.startswith('|') or re.match(r'^\|[\s:-]+\|', line):
                continue
            cells = [c.strip() for c in line.strip('|').split('|')]
            if len(cells) != 3 or cells[0] == 'stem':
                continue
            rows[cells[0]] = (cells[1], cells[2])
    return rows


def prepare_plaque():
    """Return (plaque LA image, field bbox (l, t, r, b)) at native scale."""
    frame = Image.open(FRAME_PATH).convert('RGBA')
    frame = frame.crop(frame.getchannel('A').getbbox())         # crop to alpha bbox
    # Trim the hatched ground-shadow off the bottom. The frame asset carries a
    # sparse contact shadow (plus near-invisible alpha noise reaching the image
    # bottom, which defeats the bbox crop) below the tablet's solid bottom
    # edge; composited on a plate it reads as a floating smudge. Keep rows
    # through the last SOLID row — > 50% of pixels fully opaque (alpha > 250)
    # — plus a couple px of contact shadow.
    a = np.asarray(frame, dtype=np.uint8)
    solid = (a[..., 3] > 250).mean(axis=1)
    solid_rows = np.where(solid > 0.50)[0]
    if solid_rows.size:
        frame = frame.crop((0, 0, frame.width,
                            min(frame.height, int(solid_rows[-1]) + 3)))
    w, h = frame.size
    frame = frame.resize((w, max(1, round(h * 0.384))), Image.LANCZOS)  # squash height (0.48 x 0.8)

    a = np.asarray(frame, dtype=np.uint8)
    gray = a[..., :3].mean(axis=2)
    bright = (gray > 200) & (a[..., 3] > 230)                    # the writable face
    row_frac = bright.mean(axis=1)
    col_frac = bright.mean(axis=0)
    rows = np.where(row_frac > 0.40)[0]
    cols = np.where(col_frac > 0.35)[0]
    if rows.size == 0 or cols.size == 0:
        raise SystemExit('plaque field not found — frame asset unexpected')
    field = (int(cols[0]), int(rows[0]), int(cols[-1]) + 1, int(rows[-1]) + 1)
    return frame.convert('LA'), field


def make_lut(floor, gamma):
    """Identical curve to print/plate-print-tone.py."""
    return [round(255 * (floor + (1 - floor) * (i / 255) ** gamma)) for i in range(256)]


def print_tone(master_path):
    """(tier, LUT) for a plate — tier measured on the COLOR MASTER, exactly
    as print/plate-print-tone.py measures it, so the plated-print plate gets
    the same curve as its unplaqued images/print/ twin."""
    im = Image.open(master_path).convert('L')
    hist = im.histogram()
    total = im.size[0] * im.size[1]
    near_black = sum(hist[:31]) / total
    mean = sum(i * c for i, c in enumerate(hist)) / total
    if near_black >= 0.63:
        return 'A', make_lut(0.14, 0.76)
    if mean >= 100:
        return 'C', make_lut(0.06, 0.95)
    return 'B', make_lut(0.10, 0.88)


def tracked_width(draw, text, font, tracking):
    widths = [draw.textlength(ch, font=font) for ch in text]
    return sum(widths) + tracking * (len(text) - 1)


def draw_tracked(draw, center_x, top_y, text, font, tracking, colors=(HIGHLIGHT, INK)):
    """Engraved two-pass draw, centered on center_x, top edge at top_y."""
    highlight, ink = colors
    total = tracked_width(draw, text, font, tracking)
    x = center_x - total / 2
    for dx, dy, color in ((1, 1, highlight), (0, 0, ink)):
        cx = x
        for ch in text:
            draw.text((cx + dx, top_y + dy), ch, font=font, fill=color)
            cx += draw.textlength(ch, font=font) + tracking


def text_height(font, text):
    box = font.getbbox(text)
    return box[3] - box[1], box[1]     # (height, y-offset of top)


def series_size_ratio(captions):
    """One type size for the whole series: the largest title ratio (of field
    height) at which the LONGEST inscription still fits 0.84 x field width.
    Every plaque then uses this same ratio — no per-plaque size wobble."""
    plaque, field = prepare_plaque()
    fl, ft, fr, fb = field
    field_w, field_h = fr - fl, fb - ft
    probe = Image.new('RGB', (8, 8))
    draw = ImageDraw.Draw(probe)
    ratio = 0.40
    for inscription, _ in captions.values():
        size = int(0.40 * field_h)
        while size > 8:
            font = load_font(size)
            if tracked_width(draw, inscription, font, 0.12 * size) <= 0.84 * field_w:
                break
            size -= 2
        ratio = min(ratio, size / field_h)
    return min(0.40, ratio * 1.2)   # author: text 20% bigger


def compose(stem, inscription, citation, size_ratio=None, print_toned=False):
    master = os.path.join(MASTERS_DIR, stem + '.jpg')
    if not os.path.exists(master):
        print(f'SKIP (no master): {stem}')
        return None
    if print_toned:
        base = os.path.join(PRINT_DIR, stem + '.jpg')
        if not os.path.exists(base):
            print(f'SKIP (no print plate): {stem}')
            return None
        plate = Image.open(base).convert('RGB')       # toned, bleed-aspect
        # Print plates regenerated from the 6x9 masters arrive at TRIM aspect;
        # cover-crop the height to the 6.25x9.25 BLEED aspect so the art runs
        # edge to edge on the prepress canvas (2026-07-17: four plates had
        # shipped trim-aspect and showed white bands beside the trim).
        bleed_aspect = 6.25 / 9.25
        bw, bh = plate.size
        if abs(bw / bh - bleed_aspect) > 0.002:
            target_h = round(bw / bleed_aspect)
            if target_h <= bh:
                top = (bh - target_h) // 2
                plate = plate.crop((0, top, bw, top + target_h))
        tier, lut = print_tone(master)
        colors = (tuple(lut[c] for c in HIGHLIGHT), tuple(lut[c] for c in INK))
    else:
        plate = Image.open(master).convert('RGB')
        tier, lut, colors = None, None, (HIGHLIGHT, INK)
    pw, ph = plate.size

    # Reference frame for plaque size/position: the full plate for the color
    # set (masters are authored at the 6x9 trim aspect); the TRIM box inside
    # the bleed for the print set — so both editions show the plaque at the
    # same size and margin on the finished page.
    if print_toned:
        ref_w = pw * (1 - 2 * BLEED_TRIM_X)
        ref_h = ph * (1 - 2 * BLEED_TRIM_Y)
        bottom = ph * (1 - BLEED_TRIM_Y)              # trim bottom edge
    else:
        ref_w, ref_h, bottom = pw, ph, ph

    plaque, field = prepare_plaque()
    if lut is not None:                               # tone the plaque graphic
        l_ch, a_ch = plaque.split()
        plaque = Image.merge('LA', (l_ch.point(lut), a_ch))
    s = (0.66 * ref_w) / plaque.width                 # 0.66 x page width
    plaque = plaque.resize((max(1, round(plaque.width * s)),
                            max(1, round(plaque.height * s))), Image.LANCZOS)
    fl, ft, fr, fb = [v * s for v in field]
    field_w, field_h = fr - fl, fb - ft
    field_cx, field_cy = (fl + fr) / 2, (ft + fb) / 2

    # plaque position: field center-x on page center-x, 0.02 x page-h bottom margin
    px = round(pw / 2 - field_cx)
    py = round(bottom - 0.02 * ref_h - plaque.height)
    plate.paste(plaque.convert('RGBA'), (px, py), plaque.getchannel('A'))

    draw = ImageDraw.Draw(plate)

    # series-uniform size (ratio of field height); fallback: per-plaque fit
    if size_ratio is not None:
        base = size = max(8, int(size_ratio * field_h))
        while size > 8 and tracked_width(
                draw, inscription, load_font(size), 0.12 * size) > 0.84 * field_w:
            size -= 2                    # overlong row: shrink this one only
        if size < base:
            print(f'SHRINK GUARD: {stem} title {base}px -> {size}px (overlong inscription)')
    else:
        size = int(0.40 * field_h)
        while size > 8:
            font = load_font(size)
            if tracked_width(draw, inscription, font, 0.12 * size) <= 0.84 * field_w:
                break
            size -= 2
    title_font = load_font(size)
    title_tracking = 0.12 * size

    cite_size = max(8, round(0.85 * size))
    cite_font = load_font(cite_size)
    cite_tracking = 0.12 * cite_size
    gap = 0.35 * size + 0.5 * cite_size

    th, t_off = text_height(title_font, inscription)
    ch, c_off = text_height(cite_font, citation)
    block = th + gap + ch

    # text block centered on the FIELD center, both axes (plate coordinates)
    cx = px + field_cx
    cy = py + field_cy
    title_top = cy - block / 2 - t_off
    cite_top = cy - block / 2 + th + gap - c_off
    draw_tracked(draw, cx, title_top, inscription, title_font, title_tracking, colors)
    draw_tracked(draw, cx, cite_top, citation, cite_font, cite_tracking, colors)

    if print_toned:
        os.makedirs(PRINT_OUT_DIR, exist_ok=True)
        out = os.path.join(PRINT_OUT_DIR, stem + '.jpg')
        plate.convert('L').save(out, quality=92)     # base + overlay already toned
        print(f'{out}  tier {tier}  title {size}px  citation {cite_size}px')
    else:
        os.makedirs(OUT_DIR, exist_ok=True)
        out = os.path.join(OUT_DIR, stem + '.jpg')
        plate.save(out, quality=92)
        print(f'{out}  title {size}px  citation {cite_size}px')
    return out


def main():
    args = sys.argv[1:]
    print_toned = '--print' in args
    args = [a for a in args if a != '--print']
    if not args:
        raise SystemExit('usage: python3 print/plate-plaques.py [stem ...|--all] [--print]')
    captions = read_captions()
    ratio = series_size_ratio(captions)
    print(f'series title ratio: {ratio:.3f} of field height')
    stems = sorted(captions) if args == ['--all'] else args
    for stem in stems:
        if stem not in captions:
            print(f'SKIP (no caption row): {stem}')
            continue
        compose(stem, *captions[stem], size_ratio=ratio, print_toned=print_toned)


if __name__ == '__main__':
    main()
