#!/usr/bin/env python3
"""Regenerate the grayscale print plates from the color masters with the
print-tone curve baked in (applied 2026-07-08; author-approved).

Uncoated book stock crushes everything below ~10-15% luminance to flat
black, so each plate gets a shadow lift scaled to its measured darkness:

  tier A (>=63% of pixels under 12% luminance): floor 14%, gamma 0.76
  tier C (mean luminance >= 100):               floor  6%, gamma 0.95
  tier B (everything else):                     floor 10%, gamma 0.88

Run from books/symbolic-language/:  python3 print/plate-print-tone.py [stem ...]
With no stems, rebuilds every print plate from its color master. With stems,
rebuilds only those named plates (for example, ``48w-washed-sanctified-justified``).
(plates with no color master are skipped with a warning — re-derive
those by hand from their source before re-running).
"""
from PIL import Image
import glob, os, sys

Image.MAX_IMAGE_PIXELS = None

def make_lut(floor, gamma):
    return [round(255 * (floor + (1 - floor) * (i / 255) ** gamma)) for i in range(256)]

stems = sys.argv[1:]
files = ([os.path.join('images', 'print', stem + '.jpg') for stem in stems]
         if stems else sorted(glob.glob('images/print/*.jpg')))

for f in files:
    if not os.path.exists(f):
        print('SKIP (no print plate):', f)
        continue
    master = f.replace('images/print/', 'images/masters/')
    if not os.path.exists(master):
        print('SKIP (no color master):', f)
        continue
    im = Image.open(master).convert('L')
    hist = im.histogram()
    total = im.size[0] * im.size[1]
    near_black = sum(hist[:31]) / total
    mean = sum(i * c for i, c in enumerate(hist)) / total
    if near_black >= 0.63:
        tier, lut = 'A', make_lut(0.14, 0.76)
    elif mean >= 100:
        tier, lut = 'C', make_lut(0.06, 0.95)
    else:
        tier, lut = 'B', make_lut(0.10, 0.88)
    im.point(lut).save(f, quality=92)
    print(f'{f}  tier {tier}')
