#!/usr/bin/env python3
"""Compose the YouTube video edition of an audiobook chapter.

Everything is timed off a whisper forced alignment of the finished MP3,
anchored per-chunk by the out/<stem>/segNNN.mp3 durations (render.py's
parse+chunk reproduces the exact chunk list the segments were rendered from).

Layers:
  - image bed: chapter plates (../images/masters — portrait masters become a
    blurred-fill composite), slow Ken Burns, 1s crossfade at each section title
  - narration captions: phrase-grouped lower thirds on soft rounded panels
  - scripture quote cards: dimmed full-screen card, citation from the
    [quote.scripture, REF] marker; long quotes paginate at their own
    verse/sentence seams, pages revealed in sync with the reading
  - inline scripture cards: quoted spans (5+ words) in narrator prose get the
    same card treatment, fuzzy-matched against the print twin (audio-of:
    front matter) to recover the citation; 2-4 word spans keep a small chip
  - section title cards: the [long pause]-flanked headings

All text backdrops (captions, cards, docked quotes, chips) are rounded,
blur-feathered panels sized from measured text extents — WrapStyle 2 with
explicit line breaks, so the panel geometry is exact (no hard-edged bands).

Usage:
  out/venv/bin/python video.py 09-the-seal [--animate] [--model small.en]
  (faster-whisper is only imported when out/<stem>.align.json is absent)

Stills-first workflow: the default build uses STILL beds (no zoompan — beds
encode in seconds) for fast iteration on scene choice/timing/captions during
storyboarding; --animate switches on the Ken Burns bed synthesis for the
final render. Bed clips cache by content key, so an approved chapter's
animated beds are synthesized once.

Output: out/<stem>.mp4 (1920x1080). Uses out/tools/ffmpeg (static build with
libass) when present — the homebrew ffmpeg has no subtitles/drawtext filter.
"""
import argparse, difflib, json, os, re, subprocess, sys

import render

HERE = os.path.dirname(os.path.abspath(__file__))
MASTERS = os.path.join(HERE, '..', 'images', 'masters')
UPSCALED = os.path.join(HERE, 'out', 'upscaled')
FONTS_DIR = '/System/Library/Fonts/Supplemental'
UPSCAYL_BIN = '/Applications/Upscayl.app/Contents/Resources/bin/upscayl-bin'
UPSCAYL_MODELS = '/Applications/Upscayl.app/Contents/Resources/models'
UPSCAYL_MODEL = 'upscayl-standard-4x'
W, H, FPS = 1920, 1080, 25
XFADE = 1.0
ZOOM = 0.18                     # Ken Burns zoom span: 1.0 <-> 1.18
SUPER = 4                       # plate supersample factor fed to zoompan
CAP_MAX = 95                    # max chars per narration caption event
HL0, HL1 = '\x01', '\x02'       # keyword-highlight sentinels -> gold in ASS
GOLD = '&H96C4D8&'              # citation/keyword gold (BGR)
BEDGEN = 2                      # bump to invalidate cached plates/stills/beds
INTRO = 5.5                     # branded title-card hold (s): the chapter's
                                # thumbnail composition opens every video,
                                # then the first scene fades in
DOCK_MAX = 25.0                 # quote persistence: max seconds the quote
                                # stays docked after the voice finishes
DOCK_MIN = 3.0                  # skip the dock if the discussion window is
                                # shorter than this
PAGE_CHARS = 270                # quote pagination: target plain chars/page
                                # (~3-5 display lines at the page font size)
SINGLE_PAGE_MAX = 300           # quotes at or under this stay one page
INLINE_CARD_WORDS = 5           # narrator-read scripture spans this long get
                                # the full card treatment; 2-4 words = chip
INLINE_HOLD = 3.2               # min seconds an inline card stays up
# uniform bed tone: lift the darks a touch, lean warm sepia (kept subtle).
# NOTE for future chapters: the scene-bed house style is now strict
# black-and-white Rembrandt etching (see video-prompts.md) — B&W chapters
# must drop the colorbalance cast (keep brightness/gamma only) so the B&W
# stays B&W and the selective red accents stay red. The Coin keeps its
# original sepia beds, so its TONE stays warm.
TONE = ('eq=brightness=0.04:gamma=1.18,'
        'colorbalance=rm=0.10:gm=0.03:bm=-0.10')

# persistent corner brand mark (every scene except the branded intro card):
# the book cover as a small bordered icon top-right, a two-line message in
# cream Georgia Bold beside it — a watermark, not a focal element. The
# message alternates between the two offers (author, 2026-07-10), swapping
# at scene boundaries every ~BRAND_PERIOD seconds.
COVER = os.path.join(HERE, '..', 'cover', 'front-cover-summit-meat.jpg')
BRAND_TEXT = 'TimeTested.Bible'
BRAND_LINES = (('Free eBook Available', BRAND_TEXT),
               ('Hardcover Book', BRAND_TEXT))
BRAND_PERIOD = 75.0
BRAND_CREAM = (242, 233, 214)   # thumbnail.py CREAM
BRAND_ICON_H = 120              # icon height at 1080p (thumbs use 168 at 720p)
BRAND_FS = 30                   # Georgia Bold text size
BRAND_MARGIN = 26               # safe margin from the frame edges
BRAND_GAP = 14                  # text-to-icon gap
BRAND_ALPHA = 0.80              # overlay opacity over the scene
BRAND_DOCK_ALPHA = 0.35         # receded while a docked quote holds the band

BREAK_RE = re.compile(r'<break time="([0-9.]+)s"\s*/>')


def ffmpeg_bin():
    static = os.path.join(HERE, 'out', 'tools', 'ffmpeg')
    return static if os.path.exists(static) else '/opt/homebrew/bin/ffmpeg'


def venc_args(ff):
    """Video encoder args: Apple hardware (h264_videotoolbox) when the build
    has it — ~5-10x faster than libx264 on M-series, ample quality for
    intermediates and the composite — else libx264."""
    if not hasattr(venc_args, '_c'):
        r = subprocess.run([ff, '-hide_banner', '-encoders'],
                           capture_output=True, text=True)
        venc_args._c = (
            ['-c:v', 'h264_videotoolbox', '-b:v', '12M']
            if 'h264_videotoolbox' in r.stdout else
            ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19'])
    return venc_args._c


def ffprobe_duration(path):
    out = subprocess.run(['/opt/homebrew/bin/ffprobe', '-v', 'error',
                          '-show_entries', 'format=duration',
                          '-of', 'default=nw=1:nk=1', path],
                         capture_output=True, text=True, check=True).stdout
    return float(out.strip())


def run(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode != 0:
        sys.exit(f'command failed: {" ".join(cmd[:6])}...\n{r.stderr[-2000:]}')
    return r


# ---------------------------------------------------------------- alignment

def norm(tok):
    return re.sub(r'[^a-z0-9]', '', tok.lower())


def whisper_words(audio, cache, model_name):
    if os.path.exists(cache):
        return json.load(open(cache))['words']
    from faster_whisper import WhisperModel
    print(f'transcribing {audio} with faster-whisper {model_name} ...')
    model = WhisperModel(model_name, device='cpu', compute_type='int8')
    segments, _ = model.transcribe(audio, language='en', word_timestamps=True)
    words = [{'w': w.word.strip(), 's': round(float(w.start), 3),
              'e': round(float(w.end), 3)}
             for seg in segments for w in seg.words]
    json.dump({'model': model_name, 'words': words}, open(cache, 'w'))
    print(f'cached {len(words)} words -> {cache}')
    return words


def align_chunk(tokens, words, t0, t1):
    """Assign (s, e) to each script token from whisper words inside the
    chunk's audio window; unmatched tokens interpolate between anchors."""
    win = [w for w in words if t0 - 0.75 <= (w['s'] + w['e']) / 2 <= t1 + 0.75]
    a = [t['n'] for t in tokens]
    b = [norm(w['w']) for w in win]
    times = [None] * len(tokens)
    for bl in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
        for k in range(bl.size):
            w = win[bl.b + k]
            times[bl.a + k] = (w['s'], w['e'])
    # interpolate gaps between anchors (and clamp to the chunk window)
    anchors = [(-1, t0 + 0.2, t0 + 0.2)] + \
              [(i, s, e) for i, se in enumerate(times) if se for s, e in [se]] + \
              [(len(tokens), t1, t1)]
    for (i0, _, e0), (i1, s1, _) in zip(anchors, anchors[1:]):
        gap = i1 - i0 - 1
        if gap <= 0:
            continue
        span = max(s1 - e0, 0.0)
        for k in range(1, gap + 1):
            s = e0 + span * (k - 0.5) / gap
            times[i0 + k] = (s, min(s + 0.28, s1))
    return times


# ---------------------------------------------------------------- script side

def chunk_pieces(chunks):
    """Per chunk: display pieces split at [long pause] breaks, each piece a
    list of tokens (raw, char-span, norm). Break tags become soft newlines."""
    out = []
    for role, text in chunks:
        pieces = []
        for part in re.split(r'<break time="0\.8s"\s*/>', text):
            part = re.sub(r'<break time="0\.2s"\s*/>', ' ', part)
            part = BREAK_RE.sub('\n', part)
            part = re.sub(r'[ \t]+', ' ', part).strip()
            if not part:
                continue
            toks = [{'raw': m.group(0), 'i': m.start(), 'n': norm(m.group(0))}
                    for m in re.finditer(r'\S+', part)]
            toks = [t for t in toks if t['n']]
            if toks:
                pieces.append({'text': part, 'toks': toks})
        out.append({'role': role, 'pieces': pieces})
    return out


def is_title(piece):
    t = piece['text'].strip()
    return (len(t) <= 60 and '\n' not in t and '"' not in t
            and not t.endswith(':') and len(piece['toks']) <= 9)


def scripture_blocks(script_path):
    """Ordered (ref, raw_body) for every [quote.scripture, REF] block."""
    body = open(script_path, encoding='utf-8').read()
    blocks = []
    for m in re.finditer(r'^\[quote\.scripture,\s*([^\]]+)\]\s*\n____\s*\n(.*?)\n____',
                         body, re.M | re.S):
        blocks.append((m.group(1).strip(), m.group(2)))
    return blocks


def display_clean(text):
    text = re.sub(r'__([^_]+)__', r'\1', text)
    text = re.sub(r'\*([^*]+)\*', r'\1', text)
    text = re.sub(r'_([a-zA-Zāēīōū\'-]+)_', r'\1', text)
    return re.sub(r'\s+', ' ', text).strip()


def display_quote(text, sym_words=()):
    """Quote-block source -> display text; *emphasis* spans and the print
    twin's sym-linked words get highlight sentinels (rendered gold)."""
    text = re.sub(r'__([^_]+)__', r'\1', text)
    text = re.sub(r'\*([^*]+)\*', HL0 + r'\1' + HL1, text)
    text = re.sub(r'_([a-zA-Zāēīōū\'-]+)_', r'\1', text)
    text = re.sub(r'\s+', ' ', text).strip()
    words = sorted({w.strip() for w in sym_words if w.strip()}, key=len,
                   reverse=True)
    if words:
        pat = re.compile(r'\b(?:' + '|'.join(map(re.escape, words)) + r')\b',
                         re.I)
        text = ''.join(
            part if part.startswith(HL0)
            else pat.sub(lambda m: HL0 + m.group(0) + HL1, part)
            for part in re.split(f'({HL0}[^{HL1}]*{HL1})', text))
    return text


def norm_ref(ref):
    """'2 Timothy 2:19 (KJV)' -> '2timothy219' for twin-block matching."""
    return re.sub(r'[^a-z0-9]', '', ref.lower().split('(')[0])


def print_headings(print_path):
    """Ordered section headings of the print twin ('=== ...' lines) as
    (normalized, display) pairs. The audio speaks each heading as a
    storytelling transition sentence that carries the heading's words
    (author, 2026-07-10: bare spoken headings don't tell a story); the
    on-screen title card keeps the print heading itself."""
    body = open(print_path, encoding='utf-8').read()
    return [(re.sub(r'[^a-z0-9]', '', m.group(1).lower()), m.group(1).strip())
            for m in re.finditer(r'^={2,3}\s+(.+?)\s*$', body, re.M)]


def print_sym_words(print_path):
    """Normalized ref -> display words of sym:...[...] links inside the print
    twin's matching [quote.scripture] block (print's symbol highlights)."""
    body = open(print_path, encoding='utf-8').read()
    out = {}
    for m in re.finditer(r'^\[quote\.scripture,\s*([^\]]+)\]\s*\n____\s*\n(.*?)\n____',
                         body, re.M | re.S):
        words = re.findall(r'sym:[\w-]+\[([^\]]*)\]', m.group(2))
        if words:
            out[norm_ref(m.group(1))] = words
    return out


def print_quote_pool(print_path):
    """(normalized quote words, ref) for inline-cited quotes in the print twin,
    plus its front-matter epigraphs."""
    raw = open(print_path, encoding='utf-8').read()
    pool = []
    fm = re.match(r'\A---\s*\n(.*?)\n---\s*\n(.*)\Z', raw, re.S)
    body = fm.group(2) if fm else raw
    if fm:
        for q, r in re.findall(r'-\s*quote:\s*"(.*?)"\s*\n\s*ref:\s*"(.*?)"',
                               fm.group(1)):
            pool.append((q, r))
    for q, r in re.findall(r'__“([^”]+)”__\s*\(([^)]+)\)', body):
        if re.search(r'\d', r):
            pool.append((display_clean(q), r))
    return [([w for w in map(norm, q.split()) if w], r) for q, r in pool]


def match_citation(span_text, pool):
    words = [w for w in map(norm, span_text.split()) if w]
    if len(words) < 3:
        return None
    best, best_r = 0.0, None
    for pw, ref in pool:
        r = difflib.SequenceMatcher(None, words, pw, autojunk=False).ratio()
        if r > best:
            best, best_r = r, ref
    return best_r if best >= 0.6 else None


def inline_quote_display(script_path):
    """Normalized-words -> display text (with highlight sentinels) for every
    inline __“…”__ quote in the audio script, so inline cards keep the
    script's *emphasis* as gold keywords."""
    body = open(script_path, encoding='utf-8').read()
    out = {}
    for m in re.finditer(r'__“(.+?)”__', body, re.S):
        disp = display_quote(m.group(1))
        plain = disp.replace(HL0, '').replace(HL1, '')
        key = tuple(w for w in map(norm, plain.split()) if w)
        if key:
            out[key] = disp
    return out


# ------------------------------------------------------------- pagination

def plain_text(s):
    return s.replace(HL0, '').replace(HL1, '')


def split_units(raw, sym_words):
    """Quote-block source -> display-text units at the quote's own seams:
    each source line is a verse; sentences and ;/: clauses split within."""
    units = []
    for line in raw.split('\n'):
        disp = display_quote(line, sym_words)
        if not disp:
            continue
        buf = []
        for wd in disp.split():
            buf.append(wd)
            if re.search(r'[.!?;:][\"\'”’\x01\x02]*$', wd):
                units.append(' '.join(buf))
                buf = []
        if buf:
            units.append(' '.join(buf))
    return units


def paginate(units):
    """Pack verse/sentence units into pages of ~PAGE_CHARS plain chars
    (3-5 display lines); short quotes stay one page. Highlight spans split
    by a page seam are re-balanced so gold keywords render on every page."""
    total = plain_text(' '.join(units))
    if len(total) <= SINGLE_PAGE_MAX or len(units) == 1:
        return [' '.join(units)]
    npages = -(-len(total) // PAGE_CHARS)
    target = len(total) / npages
    pages, cur, cl = [], [], 0
    for u in units:
        ul = len(plain_text(u)) + (1 if cur else 0)
        if cur and len(pages) < npages - 1 and \
                abs(cl + ul - target) > abs(cl - target):
            pages.append(' '.join(cur))
            cur, cl = [], 0
            ul = len(plain_text(u))
        cur.append(u)
        cl += ul
    if cur:
        pages.append(' '.join(cur))
    open_hl = False
    for i, pg in enumerate(pages):
        if open_hl:
            pg = HL0 + pg
        open_hl = pg.count(HL0) > pg.count(HL1)
        pages[i] = pg + (HL1 if open_hl else '')
    return pages


# ---------------------------------------------------------------- events

def split_phrases(text):
    """Prose piece -> caption-sized phrases (libass wraps within an event)."""
    parts = []
    for line in text.split('\n'):
        line = line.strip()
        if line:
            parts.extend(re.split(r'(?<=[.?!])\s+(?=[A-Z"\'])', line))
    out = []
    for p in parts:
        stack = [p]
        while stack:
            s = stack.pop(0)
            if len(s) <= CAP_MAX:
                out.append(s)
                continue
            cut = best_cut(s)
            stack = [s[:cut].strip(), s[cut:].strip()] + stack
    return [p for p in out if p]


def best_cut(s):
    mid = len(s) // 2
    for pat in (' — ', '; ', ', ', ' '):
        hits = [m.end() for m in re.finditer(re.escape(pat), s)]
        if hits:
            return min(hits, key=lambda i: abs(i - mid))
    return mid


def build_events(chunks, pieces, words, bounds, script_path, print_path,
                 scene_starts=()):
    """Returns (events, section_starts). Event kinds: caption, title, quote
    (block-scripture cards, paginated + timed by the alignment; inline
    narrator-read scripture gets the same card treatment), chip, dock
    (quote persistence). scene_starts (storyboard scene windows)
    additionally bound the docks when supplied."""
    events = []
    quotes = scripture_blocks(script_path)
    pool = print_quote_pool(print_path)
    sym_map = print_sym_words(print_path)
    inline_disp = inline_quote_display(script_path)
    headings = print_headings(print_path)
    qi = 0
    for ci, ch in enumerate(pieces):
        t0, t1 = bounds[ci], bounds[ci + 1]
        if ch['role'] == 'scripture':
            toks = [t for p in ch['pieces'] for t in p['toks']]
            times = align_chunk(toks, words, t0, t1)
            if qi < len(quotes):
                ref, raw = quotes[qi]
                units = split_units(raw, sym_map.get(norm_ref(ref), ()))
            else:
                ref = ''
                units = [display_clean(' '.join(t['raw'] for t in toks))]
            qi += 1
            s = max(t0 + 0.05, min(t for t, _ in times) - 0.3)
            e = min(t1 + 0.4, max(t for _, t in times) + 0.8)
            ptexts = paginate(units)
            counts = [len(p.split()) for p in ptexts]
            starts = [s]
            if sum(counts) == len(toks):        # page turn = its 1st word
                idx = 0
                for c in counts[:-1]:
                    idx += c
                    starts.append(max(times[idx][0] - 0.18, starts[-1] + 0.8))
            else:                               # fallback: proportional
                if len(ptexts) > 1:
                    print(f'  warn: quote/alignment token mismatch '
                          f'{sum(counts)} vs {len(toks)} ({ref})')
                for k in range(1, len(ptexts)):
                    starts.append(s + (e - s) * sum(counts[:k]) / sum(counts))
            pages = [{'s': st, 'e': en, 'text': tx} for st, en, tx
                     in zip(starts, starts[1:] + [e], ptexts)]
            fs = quote_fs(max((plain_text(p) for p in ptexts), key=len))
            events.append({'kind': 'quote', 's': s, 'e': e,
                           'text': ' '.join(units), 'ref': ref,
                           'fs': fs, 'pages': pages})
            continue
        for piece in ch['pieces']:
            toks = piece['toks']
            times = align_chunk(toks, words, t0, t1)
            for t, se in zip(toks, times):
                t['s'], t['e'] = se
            # section title card: the spoken transition sentence carries
            # the print heading's words (bare headings in older scripts
            # match too) — the card shows the print heading itself; the
            # spoken transition needs no caption under the dimmed card.
            npiece = re.sub(r'[^a-z0-9]', '', piece['text'].lower())
            if headings and len(toks) <= 14 and headings[0][0] in npiece:
                disp = headings.pop(0)[1]
                s = max(0.0, toks[0]['s'] - 0.4)
                e = max(toks[-1]['e'] + 1.6, s + 2.5)
                events.append({'kind': 'title', 's': s, 'e': e,
                               'text': disp})
                continue
            if is_title(piece):
                s = max(0.0, toks[0]['s'] - 0.4)
                e = max(toks[-1]['e'] + 1.6, s + 2.5)
                lines = [l.strip().rstrip('.') for l in
                         re.split(r'(?<=\.)\s+', piece['text']) if l.strip()]
                events.append({'kind': 'title', 's': s, 'e': e,
                               'text': '\\N'.join(lines)})
                continue
            # narration captions: map each phrase back to its token span
            cursor = 0
            for phrase in split_phrases(piece['text']):
                ph = [w for w in map(norm, phrase.split()) if w]
                span = toks[cursor:cursor + len(ph)]
                cursor += len(ph)
                if not span:
                    continue
                events.append({'kind': 'caption',
                               's': max(0.0, span[0]['s'] - 0.12),
                               'e': span[-1]['e'] + 0.45,
                               'text': re.sub(r'\s+', ' ', phrase)})
            # inline scripture in the narrator's voice: quoted spans matched
            # to the print twin's citations. 5+ words = the same card
            # treatment as a block quote (author, 2026-07-10); shorter
            # fragments keep the small citation chip.
            for m in re.finditer(r'"([^"]+)"', piece['text']):
                ref = match_citation(m.group(1), pool)
                if not ref:
                    continue
                span = [t for t in toks
                        if m.start() <= t['i'] < m.end() and 's' in t]
                if not span:
                    continue
                key = tuple(w for w in map(norm, m.group(1).split()) if w)
                if len(key) >= INLINE_CARD_WORDS:
                    text = inline_disp.get(
                        key, re.sub(r'\s+', ' ', m.group(1)).strip())
                    events.append({'kind': 'quote', 'inline': True,
                                   's': max(t0, span[0]['s'] - 0.15),
                                   'e': span[-1]['e'], 'text': text,
                                   'ref': ref})
                else:
                    events.append({'kind': 'chip', 's': span[0]['s'],
                                   'e': span[-1]['e'] + 1.0,
                                   'text': f'({ref})'})
    # inline cards: merge same-ref neighbours (no strobing), then hold each
    # through its sentence (>= INLINE_HOLD) without crowding the next card
    cards = sorted([e for e in events if e['kind'] == 'quote'],
                   key=lambda e: e['s'])
    for a, b in zip(cards, cards[1:]):
        if a.get('inline') and b.get('inline') and a['ref'] == b['ref'] \
                and b['s'] - a['e'] < 2.5:
            a['text'] += ' … ' + b['text']
            a['e'] = b['e']
            b['kill'] = True
    events = [e for e in events if not e.get('kill')]
    cards = sorted([e for e in events if e['kind'] == 'quote'],
                   key=lambda e: e['s'])
    hard0 = sorted([e['s'] for e in events
                    if e['kind'] in ('quote', 'title')] + [bounds[-1]])
    for q in cards:
        if not q.get('inline'):
            continue
        q['e'] = max(q['e'] + 1.0, q['s'] + INLINE_HOLD)
        nxt = min([t for t in hard0 if t > q['s'] + 0.01] or [bounds[-1]])
        q['e'] = min(q['e'], nxt - 0.25, bounds[-1])
        if q['e'] - q['s'] < 1.5:               # no room for a card here
            q.update(kind='chip', text=f'({q["ref"]})',
                     e=q['s'] + 2.0)
            continue
        q['fs'] = quote_fs(plain_text(q['text']))
        q['pages'] = [{'s': q['s'], 'e': q['e'], 'text': q['text']}]
    cards = sorted([e for e in events if e['kind'] == 'quote'],
                   key=lambda e: e['s'])
    # a card carries the words being read — clamp the captions that would
    # duplicate them: end early at the card edge, drop those fully inside
    for c in [e for e in events if e['kind'] == 'caption']:
        for q in cards:
            if c['s'] < q['e'] - 0.05 and c['e'] > q['s'] + 0.05:
                if c['s'] < q['s'] - 0.02:
                    c['e'] = min(c['e'], q['s'] - 0.06)
                elif c['e'] <= q['e'] + 0.6:
                    c['kill'] = True
                    break
                else:
                    c['s'] = q['e'] + 0.05
    events = [e for e in events if not e.get('kill')]
    # keep captions sequential (title cards are exempt: they may linger over
    # the first caption instead of being clipped short)
    seq = sorted([e for e in events if e['kind'] in ('caption', 'title')],
                 key=lambda e: e['s'])
    for a, b in zip(seq, seq[1:]):
        if a['kind'] == 'caption':
            a['e'] = min(a['e'], b['s'] - 0.06)
    # quote persistence: when narration keeps discussing a block quote after
    # the scripture voice finishes, dock the card smaller in the upper area
    # while the captions run below — until the next quote/title/scene
    # boundary, capped at DOCK_MAX
    hard = [e['s'] for e in events if e['kind'] in ('quote', 'title')]
    for q in [e for e in events
              if e['kind'] == 'quote' and not e.get('inline')]:
        # a scene change within ~2s of the voice finishing is the quote's
        # own discussion beat, not a topic move — it doesn't end the dock
        marks = hard + [s for s in scene_starts if s > q['e'] + 2.0]
        nxt = min([m for m in marks if m > q['e'] + 0.1] or [bounds[-1]])
        end = min(q['e'] + DOCK_MAX, nxt - 0.4, bounds[-1])
        caps = [c for c in events if c['kind'] == 'caption'
                and q['e'] - 0.5 <= c['s'] < end]
        if not caps or end - q['e'] < DOCK_MIN:
            continue
        # dock the whole quote when it fits the upper band cleanly at
        # 0.66x; otherwise the final page — the text under discussion
        dfs = max(26, round(q['fs'] * 0.66))
        text = q['text']
        if card_block(text, q.get('ref'), dfs)[2] > DOCK_CAP_H:
            text = q['pages'][-1]['text']
        events.append({'kind': 'dock', 's': q['e'], 'e': end, 'text': text,
                       'ref': q.get('ref'), 'fs': dfs})
    sections = [0.0] + [e['s'] for e in events
                        if e['kind'] == 'title' and e['s'] > 5.0]
    return events, sections


# ---------------------------------------------------- text metrics & panels
#
# Every text backdrop is a rounded, blur-feathered panel sized from the
# text it carries (author, 2026-07-10: no hard-edged boxes or bands — the
# old 620px dock curtain read as a half-screen shade bug). To size panels
# exactly, we wrap lines ourselves (WrapStyle 2) with PIL measurements of
# the same font files libass uses. Calibrated against a libass render:
# ASS fontsize F draws Georgia ≈ 0.88 x the PIL size-F width, and spaces
# lines at exactly F pixels.
ASS_FONT_SCALE = 0.885
FONT_FILES = {'quote': 'Georgia Italic.ttf', 'text': 'Georgia.ttf'}
PANEL_R = 26                    # panel corner radius
PANEL_BLUR = 10                 # \blur edge feather on every panel
QUOTE_COL = W - 2 * 230         # quote-card text column width
PAD_X, PAD_Y = 46, 34           # quote/dock panel padding
CPAD_X, CPAD_Y = 28, 16         # caption/chip panel padding
CAP_Y = H - 56                  # caption block baseline (bottom anchor)
CAP_FS = 44
DOCK_TOP = 56                   # docked card panel top edge
DOCK_CAP_H = 560                # dock the whole quote only if its panel
                                # fits this height at 0.66x body size
PANEL_A = '96'                  # card panel alpha (over the full-frame dim)
DOCK_A = '50'                   # docked panel alpha (no dim behind it)
CAP_A = '6E'                    # caption/chip panel alpha (old box alpha)

_fonts = {}


def _font(kind, fs):
    if (kind, fs) not in _fonts:
        from PIL import ImageFont
        _fonts[(kind, fs)] = ImageFont.truetype(
            os.path.join(FONTS_DIR, FONT_FILES[kind]), fs)
    return _fonts[(kind, fs)]


def text_width(s, fs, kind='quote'):
    plain = s.replace(HL0, '').replace(HL1, '')
    return _font(kind, fs).getlength(plain) * ASS_FONT_SCALE


def wrap_text(text, fs, maxw, kind='quote'):
    """Explicit greedy wrap — we own the line breaks (WrapStyle 2), so the
    panel extent and the drawn text always agree."""
    lines, cur = [], ''
    for w in text.split():
        cand = (cur + ' ' + w) if cur else w
        if cur and text_width(cand, fs, kind) > maxw:
            lines.append(cur)
            cur = w
        else:
            cur = cand
    if cur:
        lines.append(cur)
    return lines


def rrect(x0, y0, x1, y1, r):
    x0, y0, x1, y1, r = (round(v) for v in (x0, y0, x1, y1, r))
    return (f'm {x0+r} {y0} l {x1-r} {y0} b {x1} {y0} {x1} {y0} {x1} {y0+r} '
            f'l {x1} {y1-r} b {x1} {y1} {x1} {y1} {x1-r} {y1} '
            f'l {x0+r} {y1} b {x0} {y1} {x0} {y1} {x0} {y1-r} '
            f'l {x0} {y0+r} b {x0} {y0} {x0} {y0} {x0+r} {y0}')


def panel(cx, cy, w, h, alpha, fad=(200, 200)):
    """Rounded, feather-edged translucent panel centered at (cx, cy)."""
    return ('{\\an7\\pos(0,0)\\p1\\c&H000000&\\alpha&H%s&\\blur%d'
            '\\fad(%d,%d)}%s{\\p0}'
            % (alpha, PANEL_BLUR, fad[0], fad[1],
               rrect(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2, PANEL_R)))


def card_block(text, ref, fs):
    """Lay out one quote-card page: wrapped body + citation line.
    Returns (ass_body, panel_w, panel_h) — position tags added by caller."""
    cfs = cite_fs(fs)
    lines = wrap_text(esc(text), fs, QUOTE_COL - 2 * PAD_X)
    widths = [text_width(l, fs) for l in lines]
    if ref:
        widths.append(text_width('— ' + esc(ref), cfs, 'text'))
    w = max(widths) + 2 * PAD_X
    h = len(lines) * fs + (fs + cfs if ref else 0) + 2 * PAD_Y
    body = '\\N'.join(lines)
    if ref:
        body += f'\\N\\N{{\\fs{cfs}\\i0\\c{GOLD}}}— ' + esc(ref)
    return body, w, h



# ---------------------------------------------------------------- ASS

ASS_HEAD = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Narration,Georgia,{CAP_FS},&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,2,260,260,56,1
Style: Title,Georgia,64,&H00E6F0F6,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,2,0,1,0,0,5,200,200,10,1
Style: Quote,Georgia,60,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,-1,0,0,100,100,0,0,1,0,0,5,230,230,10,1
Style: Chip,Georgia,30,&H0096C4D8,&H000000FF,&H00000000,&H00000000,0,-1,0,0,100,100,0,0,1,0,0,3,48,48,150,1
Style: Dim,Georgia,20,&H00000000,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

DIM_RECT = '{\\an7\\pos(0,0)\\p1\\c&H000000&\\alpha&H%s&\\fad(350,350)}' \
           'm 0 0 l %d 0 l %d %d l 0 %d{\\p0}' % ('%s', W, W, H, H)

def quote_fs(plain):
    """Quote-card body size (+12% then +8% per author, 2026-07-10); the
    length tiers keep long quotes auto-fitting the card."""
    return 60 if len(plain) <= 150 else 53 if len(plain) <= 260 else 46


CITE_SCALE = 0.75               # citation line ≈ 3/4 of the card body size


def cite_fs(body_fs):
    """Citation-line size for a quote/dock card. Scales with the body
    (author, 2026-07-10 — the old fixed 32/24 read like a small caption at
    YouTube size); floored so the longest docked quotes keep a legible
    line. The citation stays inside the card's \\an5 event, so it centers
    under the quote body on the card's own axis."""
    return max(24, round(body_fs * CITE_SCALE))


def ass_time(t):
    t = max(t, 0.0)
    return f'{int(t // 3600)}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}'


def curly(text):
    """Straight quotes -> typographic quotes for display."""
    text = re.sub(r'(^|[\s(\[—–\x01])"', '\\1“', text)
    text = text.replace('"', '”')
    text = re.sub(r"(^|[\s(\[—–\x01])'", '\\1‘', text)
    return text.replace("'", '’')


def esc(text):
    return curly(text.replace('{', '(').replace('}', ')'))


def write_ass(events, path):
    lines = [ASS_HEAD]

    def dlg(layer, s, e, style, text, margins=(0, 0, 0)):
        ml, mr, mv = margins
        lines.append(f'Dialogue: {layer},{ass_time(s)},{ass_time(e)},{style},'
                     f',{ml},{mr},{mv},,{text}')

    for ev in sorted(events, key=lambda e: e['s']):
        s, e = ev['s'], ev['e']
        if ev['kind'] == 'caption':
            wl = wrap_text(esc(ev['text']), CAP_FS,
                           W - 2 * 260 - 2 * CPAD_X, 'text')
            wmax = max(text_width(l, CAP_FS, 'text') for l in wl)
            h = len(wl) * CAP_FS
            dlg(0, s, e, 'Dim',
                panel(960, CAP_Y - h / 2, wmax + 2 * CPAD_X, h + 2 * CPAD_Y,
                      CAP_A, (120, 140)))
            dlg(1, s, e, 'Narration',
                f'{{\\an2\\pos(960,{CAP_Y})\\fad(120,140)}}' + '\\N'.join(wl))
        elif ev['kind'] == 'chip':
            text = esc(ev['text'])
            wch = text_width(text, 30)
            dlg(0, s, e, 'Dim',
                panel(W - 48 - wch / 2, H - 150 - 15, wch + 2 * CPAD_X,
                      30 + 20, CAP_A, (200, 250)))
            dlg(1, s, e, 'Chip', '{\\fad(200,250)}' + text)
        elif ev['kind'] == 'title':
            dlg(0, s, e, 'Dim', DIM_RECT % '7A')
            dlg(1, s, e, 'Title',
                '{\\an5\\pos(960,532)\\fad(400,450)}' + esc(ev['text']))
        elif ev['kind'] == 'quote':
            # full-frame dim for the card's whole window; the text pages
            # turn in sync with the reading, each on a soft panel sized
            # to the page (one shared width so the card doesn't wobble)
            fs = ev['fs']
            pages = ev['pages']
            blocks = [card_block(p['text'], ev.get('ref'), fs)
                      for p in pages]
            pw = max(b[1] for b in blocks)
            dlg(0, s, e, 'Dim', DIM_RECT % '52')
            for i, (p, (body, _, h)) in enumerate(zip(pages, blocks)):
                fin = 350 if i == 0 else 140
                fout = 400 if i == len(pages) - 1 else 140
                dlg(0, p['s'], p['e'], 'Dim',
                    panel(960, 510, pw, h, PANEL_A, (fin, fout)))
                dlg(1, p['s'], p['e'], 'Quote',
                    f'{{\\an5\\pos(960,510)\\fs{fs}\\fad({fin},{fout})}}'
                    + body)
        elif ev['kind'] == 'dock':
            # quote persistence: the card lingers smaller on a snug panel
            # top-center while the narration's captions keep running below
            fs = ev['fs']
            body, w, h = card_block(ev['text'], ev.get('ref'), fs)
            cy = round(DOCK_TOP + h / 2)
            dlg(0, s, e, 'Dim', panel(960, cy, w, h, DOCK_A, (280, 320)))
            dlg(1, s, e, 'Quote',
                f'{{\\an5\\pos(960,{cy})\\fs{fs}\\fad(280,320)}}' + body)
    out = '\n'.join(lines) + '\n'
    out = out.replace(HL0, '{\\1c' + GOLD + '}').replace(HL1, '{\\1c&HFFFFFF&}')
    open(path, 'w', encoding='utf-8').write(out)


# ---------------------------------------------------------------- video bed

def pick_images(stem, n):
    prefix = re.match(r'\d+', stem)
    imgs = sorted(f for f in os.listdir(MASTERS)
                  if f.lower().endswith(('.jpg', '.png', '.jpeg')))
    if prefix:
        for i, f in enumerate(imgs):
            if f.startswith(prefix.group(0) + '-'):
                imgs = imgs[i:] + imgs[:i]
                break
    return [os.path.join(MASTERS, imgs[i % len(imgs)]) for i in range(n)]


def upscale_master(img):
    """AI-upscale a master 4x via Upscayl's bundled realesrgan-ncnn binary
    (headless: -i/-o/-s/-m/-n); cached in out/upscaled/. Falls back to the
    original (plain lanczos in build_plate) if the binary is absent/fails."""
    if not os.path.exists(UPSCAYL_BIN):
        return img
    os.makedirs(UPSCALED, exist_ok=True)
    out_png = os.path.join(
        UPSCALED, os.path.splitext(os.path.basename(img))[0] + '-4x.png')
    if not os.path.exists(out_png):
        print(f'  upscayl 4x: {os.path.basename(img)}')
        r = subprocess.run([UPSCAYL_BIN, '-i', img, '-o', out_png, '-s', '4',
                            '-m', UPSCAYL_MODELS, '-n', UPSCAYL_MODEL],
                           capture_output=True, text=True)
        if r.returncode != 0 or not os.path.exists(out_png):
            print('  upscayl failed; falling back to lanczos upscale')
            return img
    return out_png


def build_plate(ff, img, out_png):
    """Master (AI-upscaled when available) -> blurred-fill composite,
    supersampled to SUPER x the 1.1x-oversize bed (8448x4752) so zoompan
    samples with subpixel headroom instead of integer-rounding jitter.
    The blur bed is built small then upscaled (it is blur anyway); the
    centered plate keeps the AI-upscaled detail. TONE applied uniformly."""
    if os.path.exists(out_png):
        return
    bw, bh = int(W * 1.1), int(H * 1.1)
    sw, sh = bw * SUPER, bh * SUPER
    fc = (f'[0:v]scale={bw}:{bh}:force_original_aspect_ratio=increase,'
          f'crop={bw}:{bh},gblur=sigma=36,eq=brightness=-0.22:saturation=0.7,'
          f'scale={sw}:{sh}:flags=lanczos[bg];'
          f'[0:v]scale=-2:{sh}:flags=lanczos[fg];'
          f'[bg][fg]overlay=(W-w)/2:(H-h)/2,{TONE},setsar=1')
    run([ff, '-y', '-i', img, '-filter_complex', fc, '-frames:v', '1', out_png])


def build_still(ff, img, out_png):
    """Raw master -> toned 1920x1080 blurred-fill composite for still beds.
    No Upscayl, no supersample — built in about a second for fast
    storyboarding iteration."""
    if os.path.exists(out_png):
        return
    fc = (f'[0:v]scale={W}:{H}:force_original_aspect_ratio=increase,'
          f'crop={W}:{H},gblur=sigma=36,eq=brightness=-0.22:saturation=0.7[bg];'
          f'[0:v]scale=-2:{H}:flags=lanczos[fg];'
          f'[bg][fg]overlay=(W-w)/2:(H-h)/2,{TONE},format=yuv420p,setsar=1')
    run([ff, '-y', '-i', img, '-filter_complex', fc, '-frames:v', '1', out_png])


def build_bed(ff, stem, outdir, sections, total, animate):
    starts = sections + [total]
    imgs = pick_images(stem, len(sections))
    corners = ((-0.5, -0.5), (0.5, 0.5), (0.5, -0.5), (-0.5, 0.5))
    clips = []
    for i, img in enumerate(imgs):
        dur = (starts[i + 1] - starts[i]) + (XFADE if i + 1 < len(imgs) else 0.0)
        n = round(dur * FPS)
        base = os.path.splitext(os.path.basename(img))[0]
        # cache key = image + frame count (+ motion params when animated):
        # re-renders skip beds whose section timings didn't move
        key = (f'bed-{base}-n{n}-m{i % 4}{i % 2}-z{int(ZOOM * 100)}'
               if animate else f'bed-still-{base}-n{n}')
        clip = os.path.join(outdir, f'{key}-g{BEDGEN}.mp4')
        if os.path.exists(clip):
            print(f'  bed {i}: {os.path.basename(clip)} (cached)')
            clips.append(clip)
            continue
        print(f'  bed {i}: {os.path.basename(img)} {dur:.1f}s'
              + ('' if animate else ' (still)'))
        if not animate:
            still = os.path.join(outdir, f'still-{base}-g{BEDGEN}.png')
            build_still(ff, img, still)
            run([ff, '-y', '-loop', '1', '-framerate', str(FPS), '-i', still,
                 '-frames:v', str(n)] + venc_args(ff) + [clip])
            clips.append(clip)
            continue
        plate = os.path.join(outdir,
                             f'plate4x-g{BEDGEN}-' + os.path.basename(img) + '.png')
        build_plate(ff, upscale_master(img), plate)
        # eased 0->1 progress (even clips zoom+drift in, odd ones back out);
        # pan drifts diagonally toward an alternating corner. zoompan renders
        # at 2x target from the 4x plate, downscaled after — subpixel-smooth.
        q = (f'(0.5-0.5*cos(PI*on/{n}))' if i % 2 == 0
             else f'(0.5+0.5*cos(PI*on/{n}))')
        cx, cy = corners[i % 4]
        vf = (f"zoompan=z='1+{ZOOM}*{q}'"
              f":x='(iw-iw/zoom)*(0.5+{cx}*{q})'"
              f":y='(ih-ih/zoom)*(0.5+{cy}*{q})'"
              f':d={n}:s={2 * W}x{2 * H}:fps={FPS},'
              f'scale={W}:{H}:flags=lanczos,format=yuv420p')
        run([ff, '-y', '-loop', '1', '-framerate', str(FPS), '-i', plate,
             '-vf', vf, '-frames:v', str(n)] + venc_args(ff) + [clip])
        clips.append(clip)
    return clips


def intro_clip(ff, print_stem, outdir, size=(W, H)):
    """Branded opening card: the chapter's YouTube thumbnail composition
    (thumbnail.py output — series title, CHAPTER N, chapter name) scaled to
    frame size and held INTRO seconds before the first scene crossfades in.
    The narration (the spoken chapter title) runs underneath; the on-screen
    chapter-title event is suppressed by the caller since the card carries
    it. Returns None (and warns) when the thumbnail hasn't been built."""
    png = os.path.join(HERE, 'assets-video', 'thumbnails', print_stem + '.png')
    if not os.path.exists(png):
        print(f'  intro: no thumbnail {png} — run thumbnail.py; skipping card')
        return None
    vw, vh = size
    n = round((INTRO + XFADE) * FPS)
    key = (f'intro-{print_stem}-{int(os.path.getmtime(png))}-n{n}'
           f'-{vw}x{vh}-g{BEDGEN}')
    clip = os.path.join(outdir, key + '.mp4')
    if not os.path.exists(clip):
        run([ff, '-y', '-loop', '1', '-framerate', str(FPS), '-i', png,
             '-vf', f'scale={vw}:{vh}:flags=lanczos,format=yuv420p',
             '-frames:v', str(n)] + venc_args(ff) + [clip])
    return clip


def brand_overlay(outdir=None):
    """Build (and cache) the corner brand marks: full-frame transparent PNGs
    with the book cover as a small cream-bordered icon top-right and a
    two-line message beside it, vertically centered on the icon — one PNG
    per BRAND_LINES message. compose() lays them over the finished frame,
    alternating at scene boundaries — full strength on scenes and
    full-screen quote cards, receded to BRAND_DOCK_ALPHA while a docked
    quote holds the upper band, absent during the branded intro card
    (which carries the cover)."""
    out = outdir or os.path.join(HERE, 'out')
    from PIL import Image, ImageDraw, ImageFilter, ImageFont
    pngs = []
    for mi, msg in enumerate(BRAND_LINES):
        png = os.path.join(out, f'brand-{int(os.path.getmtime(COVER))}'
                                f'-h{BRAND_ICON_H}-fs{BRAND_FS}'
                                f'-m{mi}-g{BEDGEN}.png')
        pngs.append(png)
        if os.path.exists(png):
            continue
        canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        cov = Image.open(COVER).convert('RGB')
        ih = BRAND_ICON_H - 6
        iw = round(cov.width * ih / cov.height)
        cov = cov.resize((iw, ih), Image.LANCZOS)
        card = Image.new('RGB', (iw + 6, ih + 6), BRAND_CREAM)
        card.paste(cov, (3, 3))
        x0, y0 = W - BRAND_MARGIN - card.width, BRAND_MARGIN
        shadow = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
        ImageDraw.Draw(shadow).rectangle(
            [x0 + 3, y0 + 4, x0 + card.width + 3, y0 + card.height + 4],
            fill=(0, 0, 0, 140))
        canvas = Image.alpha_composite(canvas, shadow.filter(
            ImageFilter.GaussianBlur(7)))
        canvas.paste(card, (x0, y0))
        font = ImageFont.truetype(os.path.join(FONTS_DIR, 'Georgia Bold.ttf'),
                                  BRAND_FS)
        d = ImageDraw.Draw(canvas)
        asc, desc = font.getmetrics()
        lh = asc + desc + 4
        ty = y0 + (card.height - lh * len(msg) + 4) / 2
        for line in msg:
            tw = d.textlength(line, font=font)
            tx = x0 - BRAND_GAP - tw
            d.text((tx + 1, ty + 2), line, font=font, fill=(0, 0, 0, 150))
            d.text((tx, ty), line, font=font, fill=BRAND_CREAM + (255,))
            ty += lh
        canvas.save(png)
        print(f'  brand mark -> {os.path.basename(png)}')
    return pngs


def compose(ff, clips, sections, ass_path, audio, total, out_mp4,
            brand=None, brand_from=0.0, docks=(), size=(W, H)):
    """brand: brand_overlay() PNGs (one per corner message) laid over the
    subtitled frame from brand_from (0, or INTRO after the branded card)
    with a short alpha fade-in; the messages alternate at the first scene
    boundary past each ~BRAND_PERIOD hold. docks are (s, e) windows where
    the mark recedes to BRAND_DOCK_ALPHA so it never fights a docked
    quote card. size: output frame size — previews render at 720p (libass
    scales the 1080p PlayRes ASS; the brand PNGs are scaled here)."""
    if isinstance(brand, str):
        brand = [brand]
    vw, vh = size
    args = [ff, '-y']
    for c in clips:
        args += ['-i', c]
    args += ['-i', audio]
    for b in brand or ():
        args += ['-loop', '1', '-i', b]
    fc, cur = [], '[0:v]'
    for i in range(1, len(clips)):
        nxt = f'[x{i}]'
        fc.append(f'{cur}[{i}:v]xfade=transition=fade:duration={XFADE}'
                  f':offset={sections[i]:.3f}{nxt}')
        cur = nxt
    sub = f"{cur}subtitles=filename='{ass_path}':fontsdir='{FONTS_DIR}'"
    if brand:
        # message windows: hold each corner message >= BRAND_PERIOD, swap
        # at the next scene boundary (never mid-scene)
        wins, w0, which = [], brand_from, 0
        for m in sections:
            if m > w0 + BRAND_PERIOD and m < total - 5.0:
                wins.append((w0, m, which))
                w0, which = m, (which + 1) % len(brand)
        wins.append((w0, total, which))
        dock_expr = '+'.join(f'between(t,{s:.3f},{e:.3f})'
                             for s, e in docks) or '0'
        fc.append(sub + '[vs]')
        cur = '[vs]'
        for mi in range(len(brand)):
            msg = '+'.join(f'between(t,{s:.3f},{e:.3f})'
                           for s, e, wh in wins if wh == mi) or '0'
            bi = len(clips) + 1 + mi
            fc += [f'[{bi}:v]format=rgba,scale={vw}:{vh}'
                   f',split[b{mi}n][b{mi}d]',
                   f'[b{mi}n]colorchannelmixer=aa={BRAND_ALPHA},'
                   f'fade=t=in:st={brand_from:.2f}:d=0.6:alpha=1[bn{mi}]',
                   f'[b{mi}d]colorchannelmixer=aa={BRAND_DOCK_ALPHA}[bd{mi}]',
                   f"{cur}[bn{mi}]overlay=0:0:enable='gte(t,{brand_from:.2f})"
                   f"*({msg})*not({dock_expr})'[vn{mi}]",
                   f"[vn{mi}][bd{mi}]overlay=0:0"
                   f":enable='({msg})*({dock_expr})'[vd{mi}]"]
            cur = f'[vd{mi}]'
        fc.append(f'{cur}null[v]')
    else:
        fc.append(sub + '[v]')
    args += ['-filter_complex', ';'.join(fc), '-map', '[v]',
             '-map', f'{len(clips)}:a'] + venc_args(ff) + \
            ['-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k',
             '-movflags', '+faststart', '-t', f'{total:.3f}', out_mp4]
    run(args)


# ---------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('stem', help='chapter stem, e.g. 09-the-seal')
    ap.add_argument('--model', default='small.en')
    ap.add_argument('--animate', action='store_true',
                    help='Ken Burns bed synthesis (final render); '
                         'default is instant still beds for storyboarding')
    ap.add_argument('--no-intro', action='store_true',
                    help='skip the branded thumbnail title card')
    ap.add_argument('--out', default=os.path.join(HERE, 'out'))
    a = ap.parse_args()
    stem = re.sub(r'\.adoc$', '', os.path.basename(a.stem))

    script = os.path.join(HERE, stem + '.adoc')
    audio = os.path.join(a.out, stem + '.mp3')
    segdir = os.path.join(a.out, stem)
    fm = open(script, encoding='utf-8').read()
    m = re.search(r'^audio-of:\s*(\S+)', fm, re.M)
    print_twin = os.path.join(HERE, '..', m.group(1)) if m else script

    chunks = render.chunk(render.parse_script(script))
    segs = sorted(f for f in os.listdir(segdir)
                  if re.fullmatch(r'seg\d+\.mp3', f))
    assert len(segs) == len(chunks), f'{len(segs)} segments vs {len(chunks)} chunks'
    bounds = [0.0]
    for f in segs:
        bounds.append(bounds[-1] + ffprobe_duration(os.path.join(segdir, f)))
    total = ffprobe_duration(audio)

    words = whisper_words(audio, os.path.join(a.out, stem + '.align.json'), a.model)
    pieces = chunk_pieces(chunks)
    events, sections = build_events(chunks, pieces, words, bounds, script, print_twin)
    counts = {k: sum(1 for e in events if e['kind'] == k)
              for k in ('caption', 'quote', 'title', 'chip', 'dock')}
    print(f'events: {counts}  sections at {[round(s,1) for s in sections]}')

    ff = ffmpeg_bin()
    print_stem = os.path.splitext(os.path.basename(print_twin))[0]
    intro = None if a.no_intro else intro_clip(ff, print_stem, segdir)
    if intro:
        # the branded card carries the chapter title; drop the spoken-title
        # event it would otherwise double, and start bed 0 at the card's end
        events = [e for e in events
                  if not (e['kind'] == 'title' and e['s'] < INTRO)]
        sections = [INTRO] + [s for s in sections[1:] if s > INTRO + XFADE]

    ass_path = os.path.join(a.out, stem + '.ass')
    write_ass(events, ass_path)
    clips = build_bed(ff, stem, segdir, sections, total, a.animate)
    if intro:
        clips, sections = [intro] + clips, [0.0] + sections
    out_mp4 = os.path.join(a.out, stem + '.mp4')
    compose(ff, clips, sections, ass_path, audio, total, out_mp4,
            brand=brand_overlay(a.out),
            brand_from=INTRO if intro else 0.0,
            docks=[(e['s'], e['e']) for e in events if e['kind'] == 'dock'])
    print(f'wrote {out_mp4} ({ffprobe_duration(out_mp4):.1f}s, audio {total:.1f}s)')


if __name__ == '__main__':
    main()
