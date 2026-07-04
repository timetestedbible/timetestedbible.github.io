#!/usr/bin/env python3
"""Expand calendar-usurper-hero.jpg into a full cover-wrap canvas.

Method (no generative model): the whole canvas is underlaid with a heavily
blurred, darkened, enlarged ECHO of the painting itself — same palette,
same brushwork energy, no tiling artifacts — and the sharp original is
feathered into it on the front panel.  The echo reads as deep sky and dark
ground; the back cover gets a dreamlike shadow of the composition beneath
the blurb; the zone under the angel's feet stays rocky-dark for the title.

Output: ../../../assets/img/calendar-usurper-wrap.jpg (5186x3700 = 400 DPI
at the 12.963x9.25in wrap).  A generative outpainting can replace this file
later without touching the cover layout.
"""
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

CANVAS_W, CANVAS_H = 5186, 3700
CONTENT_W = 2400                      # sharp original spans the front panel
X0, Y0 = 2735, 200                    # content top-left (front panel, sky headroom)
FEATHER = 150                         # soft edge where sharp meets echo

src = Image.open('../../../assets/img/calendar-usurper-hero.jpg').convert('RGB')
content = src.resize((CONTENT_W, round(src.height * CONTENT_W / src.width)), Image.LANCZOS)
CW, CH = content.size                 # 2400 x 1339
X1, Y1 = X0 + CW, Y0 + CH

# ---- 1. the underlay: figure-free bands of the painting, blurred -----------
# sky band: starry left sky, cropped clear of the corona and the angel
sky_src = src.crop((0, 0, int(src.width * 0.38), int(src.height * 0.42)))
# ground band: rock, cropped clear of the moon glow
ground_src = src.crop((0, int(src.height * 0.70), int(src.width * 0.58), src.height))

def cover(im, w, h):
    s = max(w / im.width, h / im.height)
    r = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    ox, oy = (r.width - w) // 2, (r.height - h) // 2
    return r.crop((ox, oy, ox + w, oy + h))

SKY_H, GROUND_H = 2400, 1900          # bands overlap; blended below
underlay = Image.new('RGB', (CANVAS_W, CANVAS_H))
underlay.paste(cover(sky_src, CANVAS_W, SKY_H), (0, 0))
ground = cover(ground_src, CANVAS_W, GROUND_H)
# feathered junction: ground fades in over 400px starting at CANVAS_H-GROUND_H
jmask = Image.new('L', (CANVAS_W, GROUND_H), 255)
jd = ImageDraw.Draw(jmask)
for i in range(400):
    jd.line([(0, i), (CANVAS_W, i)], fill=int(255 * i / 400))
underlay.paste(ground, (0, CANVAS_H - GROUND_H), jmask)
underlay = underlay.filter(ImageFilter.GaussianBlur(26))
underlay = ImageEnhance.Brightness(underlay).enhance(0.55)

# gentle extra dusk toward the bottom (title ground) and the outer back edge
grad = Image.new('L', (CANVAS_W, CANVAS_H), 0)
gd = ImageDraw.Draw(grad)
for y in range(CANVAS_H):
    t = max(0.0, (y - Y1) / (CANVAS_H - Y1))
    gd.line([(0, y), (CANVAS_W, y)], fill=int(48 * (t ** 1.4)))
lgrad = Image.new('L', (CANVAS_W, 1), 0)
for x in range(X0):
    lgrad.putpixel((x, 0), int(55 * ((1 - x / X0) ** 1.6)))
black = Image.new('RGB', (CANVAS_W, CANVAS_H), (4, 6, 14))
underlay = Image.composite(black, underlay, grad)
underlay = Image.composite(black, underlay, lgrad.resize((CANVAS_W, CANVAS_H)))

# ---- 2. feather the sharp content into the echo ---------------------------
mask = Image.new('L', (CW, CH), 255)
md = ImageDraw.Draw(mask)
for i in range(FEATHER):
    a = int(255 * i / FEATHER)
    md.rectangle([i, i, CW - 1 - i, CH - 1 - i], outline=a)
canvas = underlay
canvas.paste(content, (X0, Y0), mask)

canvas.save('../../../assets/img/calendar-usurper-wrap.jpg', quality=92)
print(f'wrote calendar-usurper-wrap.jpg {CANVAS_W}x{CANVAS_H}; sharp content ({X0},{Y0})..({X1},{Y1})')
