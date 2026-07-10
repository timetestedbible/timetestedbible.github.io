#!/usr/bin/env python3
"""Compose the YouTube video edition of an audiobook chapter.

Everything is timed off a whisper forced alignment of the finished MP3,
anchored per-chunk by the out/<stem>/segNNN.mp3 durations (render.py's
parse+chunk reproduces the exact chunk list the segments were rendered from).

Layers:
  - image bed: chapter plates (../images/masters — portrait masters become a
    blurred-fill composite), slow Ken Burns, 1s crossfade at each section title
  - narration captions: phrase-grouped lower thirds
  - scripture quote cards: dimmed full-screen card, citation from the
    [quote.scripture, REF] marker
  - section title cards: the [long pause]-flanked headings
  - inline citation chips: quoted spans in narrator prose, fuzzy-matched
    against the print twin (audio-of: front matter) to recover (Book C:V)

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
# uniform bed tone: lift the darks a touch, lean warm sepia (kept subtle)
TONE = ('eq=brightness=0.04:gamma=1.18,'
        'colorbalance=rm=0.10:gm=0.03:bm=-0.10')

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


def build_events(chunks, pieces, words, bounds, script_path, print_path):
    """Returns (events, section_starts). Event kinds: caption, title, quote, chip."""
    events = []
    quotes = scripture_blocks(script_path)
    pool = print_quote_pool(print_path)
    sym_map = print_sym_words(print_path)
    qi = 0
    for ci, ch in enumerate(pieces):
        t0, t1 = bounds[ci], bounds[ci + 1]
        if ch['role'] == 'scripture':
            toks = [t for p in ch['pieces'] for t in p['toks']]
            times = align_chunk(toks, words, t0, t1)
            if qi < len(quotes):
                ref, raw = quotes[qi]
                text = display_quote(raw, sym_map.get(norm_ref(ref), ()))
            else:
                ref, text = '', display_clean(' '.join(t['raw'] for t in toks))
            qi += 1
            s = max(t0 + 0.05, min(t for t, _ in times) - 0.3)
            e = min(t1 + 0.4, max(t for _, t in times) + 0.8)
            events.append({'kind': 'quote', 's': s, 'e': e, 'text': text, 'ref': ref})
            continue
        for piece in ch['pieces']:
            toks = piece['toks']
            times = align_chunk(toks, words, t0, t1)
            for t, se in zip(toks, times):
                t['s'], t['e'] = se
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
            # inline citation chips from quoted spans
            for m in re.finditer(r'"([^"]+)"', piece['text']):
                ref = match_citation(m.group(1), pool)
                if not ref:
                    continue
                span = [t for t in toks
                        if m.start() <= t['i'] < m.end() and 's' in t]
                if span:
                    events.append({'kind': 'chip', 's': span[0]['s'],
                                   'e': span[-1]['e'] + 1.0,
                                   'text': f'({ref})'})
    # keep captions sequential (title cards are exempt: they may linger over
    # the first caption instead of being clipped short)
    seq = sorted([e for e in events if e['kind'] in ('caption', 'title')],
                 key=lambda e: e['s'])
    for a, b in zip(seq, seq[1:]):
        if a['kind'] == 'caption':
            a['e'] = min(a['e'], b['s'] - 0.06)
    sections = [0.0] + [e['s'] for e in events
                        if e['kind'] == 'title' and e['s'] > 5.0]
    return events, sections


# ---------------------------------------------------------------- ASS

ASS_HEAD = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Narration,Georgia,44,&H00FFFFFF,&H000000FF,&H00000000,&H6E000000,0,0,0,0,100,100,0,0,4,10,0,2,260,260,56,1
Style: Title,Georgia,64,&H00E6F0F6,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,2,0,1,0,0,5,200,200,10,1
Style: Quote,Georgia,56,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,-1,0,0,100,100,0,0,1,0,0,5,230,230,10,1
Style: Chip,Georgia,30,&H0096C4D8,&H000000FF,&H00000000,&H6E000000,0,-1,0,0,100,100,0,0,4,7,0,3,48,48,150,1
Style: Dim,Georgia,20,&H00000000,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

DIM_RECT = '{\\an7\\pos(0,0)\\p1\\c&H000000&\\alpha&H%s&\\fad(350,350)}' \
           'm 0 0 l %d 0 l %d %d l 0 %d{\\p0}' % ('%s', W, W, H, H)


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
        s, e, text = ev['s'], ev['e'], esc(ev.get('text', ''))
        if ev['kind'] == 'caption':
            dlg(1, s, e, 'Narration', '{\\fad(120,140)}' + text)
        elif ev['kind'] == 'chip':
            dlg(1, s, e, 'Chip', '{\\fad(200,250)}' + text)
        elif ev['kind'] == 'title':
            dlg(0, s, e, 'Dim', DIM_RECT % '7A')
            dlg(1, s, e, 'Title',
                '{\\an5\\pos(960,532)\\fad(400,450)}' + text)
        elif ev['kind'] == 'quote':
            plain = text.replace(HL0, '').replace(HL1, '')
            # quote-card body sizes (+12% per author, 2026-07-10); the
            # length tiers keep long quotes auto-fitting the card
            fs = 56 if len(plain) <= 150 else 49 if len(plain) <= 260 else 43
            dlg(0, s, e, 'Dim', DIM_RECT % '52')
            body = f'{{\\an5\\pos(960,510)\\fs{fs}\\fad(350,400)}}{text}'
            if ev.get('ref'):
                body += ('\\N\\N{\\fs32\\i0\\c' + GOLD + '}— ' + esc(ev['ref']))
            dlg(1, s, e, 'Quote', body, margins=(230, 230, 0))
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


def compose(ff, clips, sections, ass_path, audio, total, out_mp4):
    args = [ff, '-y']
    for c in clips:
        args += ['-i', c]
    args += ['-i', audio]
    fc, cur = [], '[0:v]'
    for i in range(1, len(clips)):
        nxt = f'[x{i}]'
        fc.append(f'{cur}[{i}:v]xfade=transition=fade:duration={XFADE}'
                  f':offset={sections[i]:.3f}{nxt}')
        cur = nxt
    fc.append(f"{cur}subtitles=filename='{ass_path}':fontsdir='{FONTS_DIR}'[v]")
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
              for k in ('caption', 'quote', 'title', 'chip')}
    print(f'events: {counts}  sections at {[round(s,1) for s in sections]}')

    ass_path = os.path.join(a.out, stem + '.ass')
    write_ass(events, ass_path)
    ff = ffmpeg_bin()
    clips = build_bed(ff, stem, segdir, sections, total, a.animate)
    out_mp4 = os.path.join(a.out, stem + '.mp4')
    compose(ff, clips, sections, ass_path, audio, total, out_mp4)
    print(f'wrote {out_mp4} ({ffprobe_duration(out_mp4):.1f}s, audio {total:.1f}s)')


if __name__ == '__main__':
    main()
