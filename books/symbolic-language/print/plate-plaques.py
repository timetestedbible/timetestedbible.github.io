#!/usr/bin/env python3
"""Composite an etched inscription plaque onto DERIVED copies of the chapter
plates (author-approved recipe, 2026-07-11). Masters stay pristine — output
goes to images/plated/<same name>.jpg, which is gitignored.

Recipe:
  frame  images/plaque-frame.png, cropped to its alpha bbox, squashed to
         0.48x height, grayscaled keeping alpha
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

Run from books/symbolic-language/:
  python3 print/plate-plaques.py 02-sower 11-fish-stater
  python3 print/plate-plaques.py --all
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
FONT_PATH = '/System/Library/Fonts/Supplemental/Baskerville.ttc'

HIGHLIGHT = (252, 252, 250)
INK = (40, 40, 40)


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
    w, h = frame.size
    frame = frame.resize((w, max(1, round(h * 0.48))), Image.LANCZOS)  # squash height

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


def tracked_width(draw, text, font, tracking):
    widths = [draw.textlength(ch, font=font) for ch in text]
    return sum(widths) + tracking * (len(text) - 1)


def draw_tracked(draw, center_x, top_y, text, font, tracking):
    """Engraved two-pass draw, centered on center_x, top edge at top_y."""
    total = tracked_width(draw, text, font, tracking)
    x = center_x - total / 2
    for dx, dy, color in ((1, 1, HIGHLIGHT), (0, 0, INK)):
        cx = x
        for ch in text:
            draw.text((cx + dx, top_y + dy), ch, font=font, fill=color)
            cx += draw.textlength(ch, font=font) + tracking


def text_height(font, text):
    box = font.getbbox(text)
    return box[3] - box[1], box[1]     # (height, y-offset of top)


def compose(stem, inscription, citation):
    master = os.path.join(MASTERS_DIR, stem + '.jpg')
    if not os.path.exists(master):
        print(f'SKIP (no master): {stem}')
        return None
    plate = Image.open(master).convert('RGB')
    pw, ph = plate.size

    plaque, field = prepare_plaque()
    s = (0.66 * pw) / plaque.width                               # 0.66 x plate width
    plaque = plaque.resize((max(1, round(plaque.width * s)),
                            max(1, round(plaque.height * s))), Image.LANCZOS)
    fl, ft, fr, fb = [v * s for v in field]
    field_w, field_h = fr - fl, fb - ft
    field_cx, field_cy = (fl + fr) / 2, (ft + fb) / 2

    # plaque position: field center-x on plate center-x, 0.02 x plate-h bottom margin
    px = round(pw / 2 - field_cx)
    py = round(ph - 0.02 * ph - plaque.height)
    plate.paste(plaque.convert('RGBA'), (px, py), plaque.getchannel('A'))

    draw = ImageDraw.Draw(plate)

    # fit title to 0.84 x field width, from 0.40 x field height stepping -2
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
    draw_tracked(draw, cx, title_top, inscription, title_font, title_tracking)
    draw_tracked(draw, cx, cite_top, citation, cite_font, cite_tracking)

    os.makedirs(OUT_DIR, exist_ok=True)
    out = os.path.join(OUT_DIR, stem + '.jpg')
    plate.save(out, quality=92)
    print(f'{out}  title {size}px  citation {cite_size}px')
    return out


def main():
    args = sys.argv[1:]
    if not args:
        raise SystemExit('usage: python3 print/plate-plaques.py [stem ...|--all]')
    captions = read_captions()
    stems = sorted(captions) if args == ['--all'] else args
    for stem in stems:
        if stem not in captions:
            print(f'SKIP (no caption row): {stem}')
            continue
        compose(stem, *captions[stem])


if __name__ == '__main__':
    main()
