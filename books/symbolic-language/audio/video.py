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
  out/venv/bin/python video.py 09-the-seal [--model small.en]
  (faster-whisper is only imported when out/<stem>.align.json is absent)

Output: out/<stem>.mp4 (1920x1080). Uses out/tools/ffmpeg (static build with
libass) when present — the homebrew ffmpeg has no subtitles/drawtext filter.
"""
import argparse, difflib, json, os, re, subprocess, sys

import render

HERE = os.path.dirname(os.path.abspath(__file__))
MASTERS = os.path.join(HERE, '..', 'images', 'masters')
FONTS_DIR = '/System/Library/Fonts/Supplemental'
W, H, FPS = 1920, 1080, 25
XFADE = 1.0
ZOOM = 0.08                     # Ken Burns range: 1.0 <-> 1.08
CAP_MAX = 95                    # max chars per narration caption event

BREAK_RE = re.compile(r'<break time="([0-9.]+)s"\s*/>')


def ffmpeg_bin():
    static = os.path.join(HERE, 'out', 'tools', 'ffmpeg')
    return static if os.path.exists(static) else '/opt/homebrew/bin/ffmpeg'


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
    """Ordered (ref, display_text) for every [quote.scripture, REF] block."""
    body = open(script_path, encoding='utf-8').read()
    blocks = []
    for m in re.finditer(r'^\[quote\.scripture,\s*([^\]]+)\]\s*\n____\s*\n(.*?)\n____',
                         body, re.M | re.S):
        blocks.append((m.group(1).strip(), display_clean(m.group(2))))
    return blocks


def display_clean(text):
    text = re.sub(r'__([^_]+)__', r'\1', text)
    text = re.sub(r'\*([^*]+)\*', r'\1', text)
    text = re.sub(r'_([a-zA-Zāēīōū\'-]+)_', r'\1', text)
    return re.sub(r'\s+', ' ', text).strip()


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
    qi = 0
    for ci, ch in enumerate(pieces):
        t0, t1 = bounds[ci], bounds[ci + 1]
        if ch['role'] == 'scripture':
            toks = [t for p in ch['pieces'] for t in p['toks']]
            times = align_chunk(toks, words, t0, t1)
            ref, text = quotes[qi] if qi < len(quotes) else ('', display_clean(
                ' '.join(t['raw'] for t in toks)))
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
    # keep same-kind events sequential (captions/titles share the timeline)
    seq = sorted([e for e in events if e['kind'] in ('caption', 'title')],
                 key=lambda e: e['s'])
    for a, b in zip(seq, seq[1:]):
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
Style: Quote,Georgia,50,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,-1,0,0,100,100,0,0,1,0,0,5,230,230,10,1
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


def esc(text):
    return text.replace('{', '(').replace('}', ')')


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
            fs = 50 if len(text) <= 150 else 44 if len(text) <= 260 else 38
            dlg(0, s, e, 'Dim', DIM_RECT % '52')
            body = f'{{\\an5\\pos(960,510)\\fs{fs}\\fad(350,400)}}{text}'
            if ev.get('ref'):
                body += ('\\N\\N{\\fs32\\i0\\c&H96C4D8&}— ' + esc(ev['ref']))
            dlg(1, s, e, 'Quote', body, margins=(230, 230, 0))
    open(path, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')


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


def build_plate(ff, img, out_png):
    """Portrait master -> 2112x1188 composite: blurred fill + centered plate."""
    if os.path.exists(out_png):
        return
    bw, bh = int(W * 1.1), int(H * 1.1)
    fc = (f'[0:v]scale={bw}:{bh}:force_original_aspect_ratio=increase,'
          f'crop={bw}:{bh},gblur=sigma=36,eq=brightness=-0.22:saturation=0.7[bg];'
          f'[0:v]scale=-2:{bh}:flags=lanczos[fg];'
          f'[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1')
    run([ff, '-y', '-i', img, '-filter_complex', fc, '-frames:v', '1', out_png])


def build_bed(ff, stem, outdir, sections, total):
    starts = sections + [total]
    imgs = pick_images(stem, len(sections))
    clips = []
    for i, img in enumerate(imgs):
        dur = (starts[i + 1] - starts[i]) + (XFADE if i + 1 < len(imgs) else 0.0)
        n = round(dur * FPS)
        plate = os.path.join(outdir, 'plate-' + os.path.basename(img) + '.png')
        build_plate(ff, img, plate)
        z = f'1+{ZOOM}*on/{n}' if i % 2 == 0 else f'1+{ZOOM}*(1-on/{n})'
        clip = os.path.join(outdir, f'bed{i:02d}.mp4')
        vf = (f"zoompan=z='{z}':x='iw/2-(iw/zoom)/2':y='ih/2-(ih/zoom)/2'"
              f':d={n}:s={W}x{H}:fps={FPS},format=yuv420p')
        print(f'  bed {i}: {os.path.basename(img)} {dur:.1f}s')
        run([ff, '-y', '-loop', '1', '-framerate', str(FPS), '-i', plate,
             '-vf', vf, '-frames:v', str(n),
             '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', clip])
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
             '-map', f'{len(clips)}:a', '-c:v', 'libx264', '-preset', 'veryfast',
             '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k',
             '-movflags', '+faststart', '-t', f'{total:.3f}', out_mp4]
    run(args)


# ---------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('stem', help='chapter stem, e.g. 09-the-seal')
    ap.add_argument('--model', default='small.en')
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
    clips = build_bed(ff, stem, segdir, sections, total)
    out_mp4 = os.path.join(a.out, stem + '.mp4')
    compose(ff, clips, sections, ass_path, audio, total, out_mp4)
    print(f'wrote {out_mp4} ({ffprobe_duration(out_mp4):.1f}s, audio {total:.1f}s)')


if __name__ == '__main__':
    main()
