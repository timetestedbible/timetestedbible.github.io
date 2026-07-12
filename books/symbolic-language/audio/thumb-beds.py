#!/usr/bin/env python3
"""Generate a landscape-native thumbnail bed for a chapter of MEAT: The
Bible's Symbolic Language via the OpenAI Images API (gpt-image-1).

The print plates are portrait (974x1442) and expand poorly to 16:9 by
blur-fill; these beds are generated landscape-native instead, depicting
the SAME subject as the chapter's book plate. Scene text comes from the
plate's committed prompt record (../plate-descriptions.md, style
boilerplate stripped), or from the SCENES override below for chapters
whose plate predates that file. Style: the book plates' approved
black-and-white Rembrandt etching family. The API renders 1536x1024;
thumbnail.py makes the final 16:9 cover crop, so the prompt keeps all
important detail in the crop-safe center band. Composition
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
  python3 thumb-beds.py --missing             # every chapter without a bed
  python3 thumb-beds.py --all                 # regenerate the complete series
  python3 thumb-beds.py --dry-run <stem>      # print the prompt only
  python3 thumb-beds.py --quality medium ...  # default: high (~$0.25/img)

Stdlib only — runs under system python3 or out/venv.
"""
import argparse, base64, glob, json, os, re, sys, time, urllib.error, urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

HERE = os.path.dirname(os.path.abspath(__file__))
BOOK = os.path.normpath(os.path.join(HERE, '..'))
PLATES = os.path.normpath(os.path.join(HERE, '..', 'plate-descriptions.md'))
BEDS = os.path.join(HERE, 'assets-video', 'thumb-beds')
PROMPTS = os.path.join(BEDS, 'PROMPTS.md')
KEYFILE = os.path.expanduser('~/.gptapi.key')
API = 'https://api.openai.com/v1/images/generations'

# Scene overrides for chapters with no ../plate-descriptions.md entry
# (their plates predate that file). One faithful description of the
# finished plate's subject, honoring the plate rules (no face of Christ).
SCENES = {
    '40s-the-ship': (
        'Ezekiel 27’s Tyre appears as one magnificent ancient Phoenician '
        'merchant ship riding high upon the sea, seen from a low three-quarter '
        'bow view. The vessel is a city-state gathered into one hull: a mature '
        'bearded pilot-ruler stands elevated at the stern with the steering '
        'oar; mariners work the rigging; armed defenders with ancient spears '
        'and round shields guard the rail; merchants stand beside visible '
        'cargo of amphorae, folded cloth, timber, metal ingots, grain sacks, '
        'and livestock. Keep these people and goods readable as one organized '
        'company aboard one bounded vessel, not a fantasy floating city. Use '
        'historically plausible Phoenician hull construction, mast, square '
        'sail, ropes, garments, weapons, and trade goods. A lane of reflected '
        'light runs beneath the ship while the first dark east wind gathers '
        'behind it, suggesting the coming break without becoming Jonah’s '
        'storm. The entire ship, pilot, crew, defenders, merchants, and cargo '
        'occupy the right half and sail toward the open right edge. The left '
        'third is only moderately dark open water and atmospheric sky with '
        'visible etched texture for the title fade, never a featureless black '
        'mass.'),
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
    '10-the-seal': (
        'The inner court of the temple at dusk. In the right half of the '
        'frame, a mature priest-scribe clothed in plain white linen stands '
        'in clear three-quarter profile. He has a plainly visible full dark '
        'beard and moustache; he is not clean-shaven. A writer\'s inkhorn '
        'hangs at his side. Before him a bearded elder kneels upright with '
        'his face lifted, so his entire forehead, eyebrows, and eyes are '
        'clearly visible. The priest-scribe uses a reed pen to finish one '
        'small crossed taw mark in dark red at the exact CENTER OF THE '
        'ELDER\'S FOREHEAD, directly above and between the eyebrows. The '
        'reed tip physically touches that forehead mark. The mark is on '
        'skin well below the hairline — never on the crown, scalp, hair, '
        'turban, or top of the head. Behind them a short line of mourners '
        'waits with heads bowed. At the edge of the light, exactly six men '
        'stand motionless with heavy slaughter weapons, held back and '
        'watching. The brazen altar looms dark behind them. The single lit '
        'lane isolates the bearded priest-scribe, his inkhorn, reed tip, '
        'the elder\'s visible brow, and the small forehead mark.'),
    '16x-weeping-and-gnashing': (
        'At night outside a great stone banqueting hall, an excluded man '
        'stands in the right half of the frame beyond the open doors, seen '
        'in three-quarter view, tears on his face and his jaw clenched in '
        'rage. Through the doorway he can see Abraham, Isaac, Jacob, and '
        'the prophets seated at a long feast table in warm light. The '
        'threshold is the hard dividing line: welcome and fellowship '
        'inside, darkness and exclusion outside. The man looks directly '
        'at the righteous within; his weeping and gnashing are a response '
        'to what he sees, not bodily torture.'),
    '17-shadow': (
        'At noon in a scorched desert, a shepherd, a woman, a child, and '
        'several sheep shelter together beneath the deep shadow of a vast '
        'overhanging rock. The rock and the protected family occupy the '
        'right half of the frame; beyond the shade the plain is cracked, '
        'white, and merciless under the high sun, with a bleached horned '
        'skull on the exposed ground. The boundary of the rock shadow is '
        'sharp and visible, and one sheep rests with its head just inside '
        'the protecting darkness.'),
    '19-liberty': (
        'At Jubilee dawn, a mature bearded priest in plain linen stands on '
        'a modest stone platform in the right half of a broad hillside '
        'scene and blows a naturally proportioned curved ram\'s-horn shofar. '
        'The horn is realistic and no longer than his forearm — never an '
        'oversized close-up. Below and beside him, still within the right '
        'half, the proclamation takes visible effect: a bearded bondservant '
        'lifts a wooden yoke completely off his shoulders; a creditor tears '
        'one clay debt tablet in two; and a family walks together toward '
        'their ancestral field and its old boundary stone. A plow rests '
        'idle in a fallow furrow, and a swallow enters a small nest near '
        'the platform. Compose these people as one readable Jubilee scene, '
        'not scattered miniatures. Place the visual center of the priest, '
        'shofar, freed servant, and returning family at exactly 75 percent '
        'of the canvas width and 50 percent of its height. Keep every key '
        'face, hand, and symbolic action between 60 and 90 percent of the '
        'canvas width. The left 40 percent contains only quiet dark hillside '
        'and dawn atmosphere for the title; no focal figure or object.'),
    '20-the-fool-and-the-wise': (
        'A violent coastal storm tests two houses in one landscape. In the '
        'right half, high on a shelf of solid rock, a square stone house '
        'stands upright with one warm lit window. Below it and nearer the '
        'sea, a timber house founded on sand leans and breaks as floodwater '
        'tears away its supports. Rain slants across both buildings, waves '
        'strike the lower house, and the same storm reveals the difference '
        'between the two foundations.'),
    '25-what-is-the-point': (
        'In a dark lamplit study, an aged bearded scribe sits at a wooden '
        'desk comparing a small open manuscript with a great unrolled '
        'Torah scroll mounted above it. His pen is poised as he follows '
        'the correspondence between the two witnesses. The scribe, the '
        'lamp, and the scrolls occupy the right half of the frame. Leave '
        'every parchment blank or marked only with indistinct strokes: no '
        'legible Hebrew, Greek, or other writing.'),
    '27-noah-uncovered': (
        'After the flood, the ark rests high on a barren mountain in the '
        'right half of the frame, immense dark timbers grounded among '
        'rocks. On its roof an aged bearded Noah lifts and folds back the '
        'great leather covering of the ark while dawn breaks over the '
        'newly uncovered earth below. The land is wet, empty, and strewn '
        'with retreating channels; one bird crosses the clearing sky. The '
        'action is uncovering the ark itself, not exposing Noah\'s body.'),
    '28-behold-the-hand': (
        'On a stone workbench in an ancient Israelite scribe\'s chamber, a '
        'strong human hand rests open beside a single bronze tent peg and '
        'a small wooden writing tablet. An aged bearded scribe at the right '
        'points from the hand to the peg as if teaching the oldest picture '
        'forms of letters. Lamplight isolates the open hand and the nail as '
        'the two brightest shapes. The tablet contains only three large '
        'simple pictographic marks, not modern Hebrew and no other legible '
        'text.'),
    '30-lucifers-declared-plan': (
        'On a high barren mountain beneath a star-filled sky, a proud dark '
        'winged figure stands in the right half of the frame holding a '
        'black eclipsed disk before the hidden sun in one raised hand and '
        'a luminous full moon low in the other. The eclipsed disk has a '
        'thin burning corona; the full moon remains round and complete. '
        'The figure looks toward a cluster of bright northern stars as '
        'though measuring a throne among them. The scene is symbolic, '
        'severe, and free of horns, modern fantasy armor, or text.'),
    '31-the-pearl': (
        'In a merchant\'s upper room at night, a bearded merchant in a '
        'plain robe holds one small perfect pearl between finger and thumb '
        'before an open window, aligning it with the full moon beyond. An '
        'open but emptied treasure chest, loose pearls, account scrolls, '
        'and a balance lie abandoned on the table. The one pearl, the '
        'merchant\'s intent face, and the full moon occupy the right half '
        'and form one clear line of sight. No legible writing anywhere.'),
    '32-the-sabbath': (
        'A hilltop camp at sunset marks the beginning of sacred rest. In '
        'the right half of the frame a bearded father closes the gate of a '
        'small work enclosure while his household gathers around a table '
        'with bread and a single newly lit oil lamp. Beyond them six '
        'worked field furrows end at the fence; the seventh strip lies '
        'untouched and quiet beneath the evening sky. The last sunlight '
        'and the lamp form the only bright points; no clocks, calendars, '
        'modern objects, or text.'),
    '35-the-fall-of-babylon': (
        'At night on a dark sea, a massive circular millstone has just been '
        'cast down and is sinking upright into the water in the right half '
        'of the frame, throwing up a ring of white spray. Across the water '
        'a proud walled maritime city burns from end to end, its towers '
        'black against a column of smoke. Merchant ships stand offshore '
        'and watch. The sinking stone is close, heavy, and unmistakable; '
        'the doomed city remains visible beyond it.'),
    '36-daniel-unsealed': (
        'In a Babylonian chamber at night, an aged bearded Daniel presses '
        'a square signet into wax on a large rolled scroll bound with cord. '
        'A lamp lights his hands, the seal, and the closed scroll in the '
        'right half of the frame. Through an open window the dark stepped '
        'ziggurat and a precise field of stars rise beyond the city. Clay '
        'tablets and reed pens lie nearby, but no writing or seal impression '
        'is legible.'),
    '37-clouds': (
        'Above a dry land, a vast luminous storm cloud rolls like a royal '
        'chariot across the right half of the sky. From its lower edge '
        'fine rain descends in visible engraved lines onto a waiting field, '
        'while the leftward land remains dry and dark beneath the title '
        'area. Within the bright heart of the cloud is only the suggestion '
        'of an enthroned presence made of light, with no visible face or '
        'body. Below, a lone prophet raises his hands toward the arriving '
        'cloud and the life-giving rain.'),
    '38-the-moment': (
        'A proud walled city is caught at the single instant judgment '
        'arrives. In the right half of the frame one tower still stands '
        'while the neighboring tower begins to collapse, a great crack '
        'opening through its masonry; a watchman recoils as the city lamp '
        'beside him is blown out. Lightning freezes falling stones and '
        'dust in midair. The composition feels like the blink between '
        'security and ruin, not a long siege.'),
    '38x-further-studies': (
        'In an old scholar\'s study, seven sealed and unsealed scrolls lie '
        'in a deliberate fan across a broad wooden table in the right half '
        'of the frame, each accompanied by one small symbolic object: a '
        'bronze nail, a wisp of cloud from an incense bowl, an extinguished '
        'lamp, a seventh-day oil lamp, a clenched jaw carved in stone, a '
        'cluster of grapes, and two olives left on a twig. A bearded reader '
        'reaches toward the scrolls. No legible writing or labels.'),
    '39-mountain': (
        'A colossal ceremonial monument of an ancient armored king stands '
        'in the right half of the frame, fully clothed from neck to feet in '
        'rigid layered metal robes: a gold-toned helmet, silver breastplate '
        'and sleeves, bronze belt and skirt armor, and iron greaves over '
        'clay-mixed boots. It is unmistakably an inanimate constructed '
        'statue, not a living or nude body. A rough uncut stone has just '
        'struck the boots, sending fractures upward as the monument begins '
        'to topple. Behind it the same stone has become a great new mountain '
        'spreading across the horizon, its summit breaking into light.'),
    '41x-the-parable-of-the-vineyard': (
        'A carefully planted vineyard fills the right half of the frame: '
        'a stone salvation-wall surrounds the vines, a watchtower rises in '
        'their midst, and a rock-hewn winepress waits heavy with dark '
        'grapes. At the gate, armed tenant husbandmen reject a lone servant '
        'sent by the absent owner, while another messenger lies wounded '
        'beside the wall. The tower, press, tenants, and rejected messenger '
        'are all readable in one coherent estate; no visible face of Christ '
        'and no text.'),
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

# Deterministic follow-up edits applied after generation. Keep these in the
# committed prompt ledger because the source PNG beds are local-only.
POST_EDITS = {
    '29-sun-moon-and-stars': (
        'Post-generation precise-object edit (built-in image editor): the '
        'generated bed contained twelve five-point stars. Remove only the '
        'isolated topmost star directly below the sun (approximately '
        'x=64.4%, y=28.4%) and fill it with matching cross-hatched night '
        'sky. Preserve both lowest stars and every other element unchanged; '
        'the final bed contains exactly eleven stars.'),
}

STYLE = (
    'Use case: historical-scene. Asset type: YouTube thumbnail background. '
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
    'detail, because a title panel will cover the left side. Place the '
    'visual center of the focal action at 75 percent of the canvas width '
    'and 50 percent of its height — center-right, never canvas-center. '
    'Keep clear '
    'margin between the focal subject and the frame edges. The API canvas '
    'is 3:2 and will be center-cropped to 16:9, so nothing important may '
    'enter the top or bottom eighth of the frame. Every crowd '
    'figure and onlooker faces the focal subject, so all sight-lines in '
    'the composition point at it. The image '
    'contains absolutely no text, lettering, inscriptions, captions, or '
    'watermarks of any kind. Avoid modern objects, glossy digital-painting '
    'surfaces, photographic color, sepia, decorative borders, and frames.')

HEADER = """# Thumbnail bed prompts — landscape-native backgrounds

Written by `audio/thumb-beds.py` (OpenAI Images API, gpt-image-1). The
images are local-only (`assets-video/` is gitignored); this file is the
committed record from which any bed regenerates:

    python3 thumb-beds.py <print-stem> [...]

Scene = the chapter's book-plate subject (auto-extracted from
`../plate-descriptions.md` with the etching-style boilerplate stripped,
or the SCENES override in thumb-beds.py); style = strict BLACK-AND-WHITE
Rembrandt etching (author, 2026-07-10 — the earlier Doré-sepia-with-color
language is retired), one selective accent color only where an ACCENTS
entry names it (red for blood/stamp/mark, warm gold for metal).
`thumbnail.py` prefers
`assets-video/thumb-beds/<stem>.png` over the blur-filled plate.

The Images API source canvas is 1536x1024 (3:2). Prompts reserve the top
and bottom eighth; `thumbnail.py` center-crops that safe composition to the
final YouTube-native 1280x720 (16:9) frame without stretching or blur-fill.

Composition rules (standing): the focal subject lives entirely in the
RIGHT HALF of the frame — the thumbnail's title band covers the left.
The visual center of the focal action is x=75%, y=50%, never the canvas
center. Nothing important left of center; the left third stays quiet and dark.
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
    for m in re.finditer(
            r'^## (\d+) — [^\n]*\n\n(?!## )(.+?)(?=\n## |\Z)',
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


def all_stems():
    stems = []
    for path in sorted(glob.glob(os.path.join(BOOK, '[0-9][0-9]*-*.adoc'))):
        stem = os.path.splitext(os.path.basename(path))[0]
        if stem.startswith('00-') or stem in ('49-glossary',
                                              '50-about-the-author'):
            continue
        stems.append(stem)
    return stems


def has_bed(stem):
    return os.path.exists(os.path.join(BEDS, stem + '.png'))


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
        raise RuntimeError(
            f'API error {e.code}: {e.read().decode(errors="replace")}') from e
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
    if stem in POST_EDITS:
        entries[stem] += f'\n\n{POST_EDITS[stem]}'
    with open(PROMPTS, 'w', encoding='utf-8') as f:
        f.write(HEADER)
        for k in sorted(entries):
            f.write(f'## {k}\n\n{entries[k]}\n\n')


def generate_one(stem, prompt, size, quality):
    img, dt, usage = generate(prompt, size, quality)
    out = os.path.join(BEDS, f'{stem}.png')
    with open(out, 'wb') as f:
        f.write(img)
    return stem, prompt, out, len(img), dt, usage


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('stems', nargs='*', help='print chapter stem(s)')
    mode = ap.add_mutually_exclusive_group()
    mode.add_argument('--all', action='store_true',
                      help='every thumbnail-bearing chapter')
    mode.add_argument('--missing', action='store_true',
                      help='every chapter without a dedicated bed')
    ap.add_argument('--size', default='1536x1024')
    ap.add_argument('--quality', default='high',
                    choices=['low', 'medium', 'high'])
    ap.add_argument('--jobs', type=int, default=1,
                    help='concurrent API generations (default: 1)')
    ap.add_argument('--dry-run', action='store_true',
                    help='print prompts, no API call')
    ap.add_argument('--record-only', action='store_true',
                    help='update PROMPTS.md without generating images')
    args = ap.parse_args()
    if args.all:
        stems = all_stems()
    elif args.missing:
        stems = [stem for stem in all_stems() if not has_bed(stem)]
    else:
        stems = args.stems
    if not stems:
        ap.error('give chapter stems, --missing, or --all')
    if args.jobs < 1:
        ap.error('--jobs must be at least 1')
    os.makedirs(BEDS, exist_ok=True)
    prompts = [(stem, build_prompt(stem)) for stem in stems]
    if args.dry_run:
        for stem, prompt in prompts:
            print(f'--- {stem}\n{prompt}\n')
        return
    if args.record_only:
        for stem, prompt in prompts:
            record_prompt(stem, prompt, args.size, args.quality)
        print(f'{len(prompts)} prompt records -> {PROMPTS}')
        return
    failures = []
    with ThreadPoolExecutor(max_workers=args.jobs) as pool:
        futures = [pool.submit(generate_one, stem, prompt, args.size,
                               args.quality)
                   for stem, prompt in prompts]
        for future in as_completed(futures):
            try:
                stem, prompt, out, size, dt, usage = future.result()
            except Exception as exc:
                failures.append(str(exc))
                print(f'FAILED: {exc}', file=sys.stderr, flush=True)
                continue
            record_prompt(stem, prompt, args.size, args.quality)
            ti = usage.get('input_tokens', 0)
            to = usage.get('output_tokens', 0)
            cost = ti * 5 / 1e6 + to * 40 / 1e6
            print(f'{stem}: {size // 1024} KB in {dt:.0f}s, '
                  f'tokens in={ti} out={to} (~${cost:.2f}) -> {out}',
                  flush=True)
    if failures:
        sys.exit(f'{len(failures)} generation(s) failed')


if __name__ == '__main__':
    main()
