#!/usr/bin/env python3
"""Generate a dedicated 16:9 thumbnail bed for a chapter of MEAT: The
Bible's Symbolic Language via the OpenAI Images API (gpt-image-1).

The print plates are portrait (974x1442) and expand poorly to 16:9 by
blur-fill; these beds are generated landscape-native instead, depicting
the SAME subject as the chapter's book plate. Scene text comes from the
plate's committed prompt record (../plate-descriptions.md, style
boilerplate stripped), or from the SCENES override below for chapters
whose plate predates that file. Style: the approved storyboard-bed Doré
sepia family, but with subtle muted color allowed over the warm sepia
base — the print plates were B&W-constrained; thumbnails are not. Composition
rule: the focal subject lives entirely in the RIGHT HALF of the frame —
the left half is covered by the thumbnail's title band (see
assets-video/thumbnails/TEMPLATE.md); nothing important left of center,
left third quiet and dark.

API key: ~/.gptapi.key (plain text; never printed). Outputs:
  assets-video/thumb-beds/<stem>.png   image, local-only (gitignored)
  assets-video/thumb-beds/PROMPTS.md   prompt record, committed (add -f)
thumbnail.py prefers assets-video/thumb-beds/<stem>.png automatically.

Usage:
  python3 thumb-beds.py 01-introduction 10-the-seal [...]
  python3 thumb-beds.py --dry-run <stem>      # print the prompt only
  python3 thumb-beds.py --quality medium ...  # default: high (~$0.25/img)

Stdlib only — runs under system python3 or out/venv.
"""
import argparse, base64, json, os, re, sys, time, urllib.error, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
PLATES = os.path.normpath(os.path.join(HERE, '..', 'plate-descriptions.md'))
BEDS = os.path.join(HERE, 'assets-video', 'thumb-beds')
PROMPTS = os.path.join(BEDS, 'PROMPTS.md')
KEYFILE = os.path.expanduser('~/.gptapi.key')
API = 'https://api.openai.com/v1/images/generations'

# Scene overrides for chapters with no ../plate-descriptions.md entry
# (their plates predate that file). One faithful description of the
# finished plate's subject, honoring the plate rules (no face of Christ).
SCENES = {
    '01-introduction': (
        'On a grassy rise above the Sea of Galilee at evening, a robed '
        'figure stands in the right half of the frame, seen entirely '
        'from behind — the back of his head square to the viewer, only '
        'hair, shoulders, and robe; no brow, no nose, no beard, no '
        'profile visible. Above his two open upturned hands he holds '
        'one single straight row of exactly five small round barley '
        'loaves, side by side: the first loaf at the left end of the '
        'row, the second beside it, the third at the center, the '
        'fourth beside that, and the fifth at the right end — five '
        'loaves in one row, no loaf behind another, none hidden, not '
        'four, not six — and the light breaking through the clouds '
        'falls on that row of five loaves alone. A small '
        'wicker basket at his feet holds two small fish. '
        'The multitude sits on the grass in family '
        'groups — separate loose clusters of adults and children, '
        'parents with children gathered beside them, open grass between '
        'the clusters, never rows or ranks or a packed uniform mass. '
        'Every group is seen from behind or in three-quarter view, '
        'backs mostly toward the viewer, and every figure in every '
        'cluster is turned toward the loaf-bearer, so every sight-line '
        'in the scene converges on the five lifted loaves. The clusters '
        'gather toward the figure on the right and thin away into '
        'darkness at the left, the hillside and the dim shining water '
        'beyond them.'),
}

# One selective accent per the approved Seal recipe: red where the mark
# itself appears; warm metallic gleam instead when the "seal" IS metal.
ACCENTS = {
    '10-the-seal': (
        'Accent: the small crossed mark on the kneeling elder’s '
        'forehead and the ink at the horn carry a deep muted red — the '
        'frame’s one strong color.'),
    '11-the-coin': (
        'Accent: the coin in the fish’s mouth gleams warm '
        'silver-gold, the frame’s brightest point; no red anywhere.'),
}

STYLE = (
    'Style: a black-and-white etching in the style of Rembrandt — fine '
    'cross-hatched line work, drypoint burr, dramatic chiaroscuro, the '
    'look of an aged copper-plate print; pure black ink on white paper, '
    'line work only, strictly monochrome black and white, no sepia, no '
    'brown tones, no color tint of any kind beyond the single named '
    'accent when one is specified, with a lighter exposure — overall '
    'bright enough to read as a lit scene, not sunk in shadow. Recompose '
    'the scene for a wide 16:9 landscape frame: the focal subject sits '
    'entirely within the RIGHT HALF of the frame — every important '
    'element, figure, and point of light stays right of the vertical '
    'centerline, with nothing that matters left of center; the left '
    'third stays quiet, simple, dark, and atmospheric, with no focal '
    'detail, because a title panel will cover the left side. Keep clear '
    'margin between the focal subject and the frame edges — nothing '
    'important in the top or bottom tenth of the frame. Every crowd '
    'figure and onlooker faces the focal subject, so all sight-lines in '
    'the composition point at it. The image '
    'contains absolutely no text, lettering, inscriptions, captions, or '
    'watermarks of any kind.')

HEADER = """# Thumbnail bed prompts — dedicated 16:9 backgrounds

Written by `audio/thumb-beds.py` (OpenAI Images API, gpt-image-1). The
images are local-only (`assets-video/` is gitignored); this file is the
committed record from which any bed regenerates:

    python3 thumb-beds.py <print-stem> [...]

Scene = the chapter's book-plate subject (auto-extracted from
`../plate-descriptions.md` with the etching-style boilerplate stripped,
or the SCENES override in thumb-beds.py); style = strict BLACK-AND-WHITE
Rembrandt etching (author, 2026-07-10 — the earlier Doré-sepia-with-color
language is retired), one selective accent color only where an ACCENTS
entry names it (red for blood/stamp/mark, warm gold for metal). Beds are
grayscale-normalized on install. `thumbnail.py` prefers
`assets-video/thumb-beds/<stem>.png` over the blur-filled plate.

Composition rules (standing): the focal subject lives entirely in the
RIGHT HALF of the frame — the thumbnail's title band covers the left.
Nothing important left of center; the left third stays quiet and dark.
Crowd/onlooker sight-lines must aim at the focal subject (crowds seen
from behind or three-quarter, faces toward it). A bed whose subject
strays left can sometimes be salvaged without regeneration via
`thumbnail.py` `BED_TRANSFORMS` (mirror + slide-right).

Prompt lessons (standing): (1) explicit object counts — when a count
matters (FIVE loaves), name the number, call each item distinct and
countable, and give the counted objects their own lit focal moment;
never bundle them into a compound action ("five loaves and two fishes
overhead" rendered fish only). (2) Crowds default to packed uniform
rows facing anywhere; describe FAMILY GROUPS — separate clusters of
adults and children with open grass between them, seen from behind or
three-quarter, every figure turned toward the focal subject. (3) Figure
rules (author): priests/scribes/patriarchs wear BEARDS; for the
frontlets texts ("between thine eyes") never depict Orthodox prayer
boxes strapped to heads — the mark/writing sits on hand and forehead;
a pen marking a forehead marks the FOREHEAD, not the hairline. (4) The
subject faces INTO the open right field (face and action toward the
right edge) so no mirror surgery is needed; native 1536x1024 is taller
than 16:9 — thumbnail.py fit='height' keeps the full plate, so edge-to-
edge compositions are safe, but keep the focal subject clear of the
absolute frame edges.

"""


def plate_scene(stem):
    """Scene sentence(s) for the chapter's plate subject: the SCENES
    override, else the ../plate-descriptions.md entry matched by chapter
    number, with the leading etching-style sentence and the trailing
    'Stippled ... Portrait orientation' boilerplate stripped."""
    if stem in SCENES:
        return SCENES[stem]
    num = stem.split('-', 1)[0]
    if num.endswith('x'):
        sys.exit(f'{stem}: bonus chapter — add a SCENES override')
    n = int(num)
    text = open(PLATES, encoding='utf-8').read()
    for m in re.finditer(r'^## (\d+) — .*?\n\n(.+?)(?=\n## |\Z)',
                         text, re.M | re.S):
        if int(m.group(1)) != n:
            continue
        para = m.group(2).strip().split('\n\n')[0].strip()
        if para.startswith('## '):      # SKIP entry with no paragraph
            break
        cut = para.find('no gray washes.')
        if cut >= 0:
            para = para[cut + len('no gray washes.'):].lstrip()
        tail = para.rfind('Stippled')
        if tail > 0:
            para = para[:tail].rstrip()
        return para
    sys.exit(f'{stem}: no plate-descriptions.md entry — '
             'add a SCENES override in thumb-beds.py')


def build_prompt(stem):
    parts = [plate_scene(stem)]
    if stem in ACCENTS:
        parts.append(ACCENTS[stem])
    parts.append(STYLE)
    return ' '.join(parts)


def generate(prompt, size, quality):
    key = open(KEYFILE, encoding='utf-8').read().strip()
    req = urllib.request.Request(API, data=json.dumps(
        {'model': 'gpt-image-1', 'prompt': prompt,
         'size': size, 'quality': quality}).encode(),
        headers={'Authorization': f'Bearer {key}',
                 'Content-Type': 'application/json'})
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            resp = json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f'API error {e.code}: {e.read().decode(errors="replace")}')
    dt = time.time() - t0
    return base64.b64decode(resp['data'][0]['b64_json']), dt, \
        resp.get('usage', {})


def record_prompt(stem, prompt, size, quality):
    """Rewrite PROMPTS.md with this stem's entry added/replaced."""
    entries = {}
    if os.path.exists(PROMPTS):
        text = open(PROMPTS, encoding='utf-8').read()
        for m in re.finditer(r'^## (\S+)\n\n(.*?)(?=\n## |\Z)',
                             text, re.M | re.S):
            entries[m.group(1)] = m.group(2).strip()
    entries[stem] = f'({size}, quality {quality})\n\n{prompt}'
    with open(PROMPTS, 'w', encoding='utf-8') as f:
        f.write(HEADER)
        for k in sorted(entries):
            f.write(f'## {k}\n\n{entries[k]}\n\n')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('stems', nargs='+', help='print chapter stem(s)')
    ap.add_argument('--size', default='1536x1024')
    ap.add_argument('--quality', default='high',
                    choices=['low', 'medium', 'high'])
    ap.add_argument('--dry-run', action='store_true',
                    help='print prompts, no API call')
    args = ap.parse_args()
    os.makedirs(BEDS, exist_ok=True)
    for stem in args.stems:
        prompt = build_prompt(stem)
        if args.dry_run:
            print(f'--- {stem}\n{prompt}\n')
            continue
        img, dt, usage = generate(prompt, args.size, args.quality)
        out = os.path.join(BEDS, f'{stem}.png')
        with open(out, 'wb') as f:
            f.write(img)
        record_prompt(stem, prompt, args.size, args.quality)
        ti = usage.get('input_tokens', 0)
        to = usage.get('output_tokens', 0)
        cost = ti * 5 / 1e6 + to * 40 / 1e6
        print(f'{stem}: {len(img) // 1024} KB in {dt:.0f}s, '
              f'tokens in={ti} out={to} (~${cost:.2f}) -> {out}')


if __name__ == '__main__':
    main()
