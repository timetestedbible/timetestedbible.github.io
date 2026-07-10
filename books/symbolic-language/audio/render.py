#!/usr/bin/env python3
"""Render an audio/NN-*.adoc narration script to MP3 via ElevenLabs.

Usage:
  ELEVENLABS_API_KEY=... python3 render.py 09-the-seal.adoc [--voice VOICE_ID]
                                           [--model eleven_multilingual_v2]
                                           [--out out/]

Marker mapping (see README.md):
  [beat]        -> <break time="0.3s" />
  [pause]       -> <break time="0.7s" />
  [long pause]  -> <break time="1.2s" />   (also the chunk boundary)

Chunks split at [long pause] boundaries and re-pack to <= MAX_CHARS.
Each request passes previous_text/next_text so ElevenLabs keeps prosody
continuous across chunk seams. Segments land in out/<stem>/segNNN.mp3 and are
concatenated to out/<stem>.mp3 (ffmpeg if available, else raw concat — fine
for same-voice same-model MP3 segments).
"""
import argparse, json, os, re, subprocess, sys, time, urllib.request

API = 'https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128'
MAX_CHARS = 4000          # stay under API per-request limits with headroom
BREAKS = {'[beat]': '<break time="0.2s" />',
          '[pause]': '<break time="0.45s" />',
          '[long pause]': '<break time="0.8s" />'}

def _clean(text):
    # asciidoc emphasis -> plain words (ElevenLabs stresses from punctuation/context)
    text = re.sub(r'__([^_]+)__', r'\1', text)
    text = re.sub(r'\*([^*]+)\*', r'\1', text)
    text = re.sub(r'_([a-zA-Zāēīōū\'-]+)_', r'\1', text)   # transliterated terms
    return text.replace('…', '...').replace('“', '"').replace('”', '"').replace('’', "'")

ORDINALS = {'1': 'First', '2': 'Second', '3': 'Third'}

def spoken_citation(ref):
    """'2 Timothy 2:19' -> 'Second Timothy, chapter 2.' Book+chapter only —
    verse numbers are print apparatus, not speech."""
    m = re.match(r'^\s*(\d)?\s*([A-Za-z][A-Za-z ]*?)\s+(\d+)(?::.*)?$', ref.strip())
    if not m:
        return None
    num, book, chap = m.groups()
    name = (ORDINALS.get(num, '') + ' ' if num else '') + book.strip()
    return f'{name} {chap}'

def parse_script(path):
    """Returns ordered segments [(role, text)], role in {'narrator', 'scripture'}.
    Block quotes (____ fences) are scripture; everything else narrator. Brief
    inline quotes inside narrator prose stay narrator. A cited quote's citation
    is spoken (book + chapter) by the narrator right after the quote."""
    raw = open(path, encoding='utf-8').read()
    m = re.match(r'\A---\s*\n.*?\n---\s*\n(.*)\Z', raw, re.S)
    body = m.group(1) if m else raw
    segs, cur, role, in_quote, pending, ref = [], [], 'narrator', False, 'narrator', None
    for line in body.split('\n'):
        mq = re.match(r'^\[quote[^,\]]*(?:,([^\]]+))?\]\s*$', line)
        if mq:
            # a citation in the print marker = worth the scripture voice
            ref = mq.group(1)
            pending = 'scripture' if ref else 'narrator'
            continue
        if re.match(r'^____\s*$', line):
            if cur and ''.join(cur).strip():
                segs.append((role, _clean('\n'.join(cur).strip())))
            cur = []
            if in_quote:
                role, in_quote, pending, ref = 'narrator', False, 'narrator', None
            else:
                # citation-first: weave the spoken reference into the intro's
                # final clause, cueing the voice change and naming the reading
                if pending == 'scripture' and ref and segs and segs[-1][0] == 'narrator':
                    spoken = spoken_citation(ref)
                    # dedupe: skip if the intro already names the citation
                    if spoken and spoken.lower() in segs[-1][1][-60:].lower():
                        spoken = None
                    if spoken:
                        prev_role, prev = segs[-1]
                        prev = prev.rstrip()
                        if prev.endswith(':'):
                            prev = prev[:-1].rstrip() + f' — {spoken}:'
                        else:
                            prev = prev + f' {spoken}:'
                        segs[-1] = (prev_role, prev)
                role, in_quote = pending, True
            continue
        cur.append(line)
    if cur and ''.join(cur).strip():
        segs.append((role, _clean('\n'.join(cur).strip())))
    return segs

def chunk(segs, quote_min=0):
    """[(role, text)] -> [(role, chunk_text)]; same-role runs pack under
    MAX_CHARS, splitting at [long pause] when a run must divide. Scripture
    segments shorter than quote_min chars stay in the narrator's voice —
    only quotes with real body earn the voice switch."""
    segs = [('narrator' if role == 'scripture' and len(text) < quote_min else role, text)
            for role, text in segs]
    chunks = []
    for role, text in segs:
        parts = [p.strip() for p in text.split('[long pause]') if p.strip()]
        cur = ''
        for p in parts:
            candidate = (cur + '\n' + BREAKS['[long pause]'] + '\n' + p) if cur else p
            if len(candidate) > MAX_CHARS and cur:
                chunks.append((role, cur))
                cur = p
            else:
                cur = candidate
        if cur:
            if chunks and chunks[-1][0] == role and len(chunks[-1][1]) + len(cur) < MAX_CHARS:
                chunks[-1] = (role, chunks[-1][1] + '\n' + BREAKS['[long pause]'] + '\n' + cur)
            else:
                chunks.append((role, cur))
    out = []
    for i, (role, c) in enumerate(chunks):
        c = apply_breaks(c)
        if i > 0 and chunks[i-1][0] != role:
            c = '<break time="0.3s" />\n' + c      # breath at every voice handoff
        out.append((role, c))
    return out

def apply_breaks(c):
    for k, v in BREAKS.items():
        c = c.replace(k, v)
    return c

def tts(chunks, voices, model, key, outdir, stem):
    """chunks: [(role, text)]; voices: {'narrator': id, 'scripture': id}."""
    seg_paths = []
    os.makedirs(os.path.join(outdir, stem), exist_ok=True)
    for i, (role, c) in enumerate(chunks):
        voice = voices.get(role) or voices['narrator']
        body = {'text': c, 'model_id': model,
                'previous_text': chunks[i-1][1][-500:] if i > 0 else None,
                'next_text': chunks[i+1][1][:500] if i + 1 < len(chunks) else None,
                'voice_settings': {'stability': 0.5, 'similarity_boost': 0.75}}
        body = {k: v for k, v in body.items() if v is not None}
        req = urllib.request.Request(API.format(voice=voice),
                                     data=json.dumps(body).encode(),
                                     headers={'xi-api-key': key, 'Content-Type': 'application/json'})
        for attempt in range(3):
            try:
                with urllib.request.urlopen(req, timeout=300) as r:
                    audio = r.read()
                break
            except urllib.error.HTTPError as e:
                detail = e.read()[:300]
                if attempt == 2:
                    print(f'  seg{i:03d} FAILED: {e} {detail}', file=sys.stderr)
                    raise
                print(f'  seg{i:03d} retry after {e}: {detail}', file=sys.stderr)
                time.sleep(5 * (attempt + 1))
            except Exception as e:
                if attempt == 2:
                    raise
                print(f'  seg{i:03d} retry after error: {e}', file=sys.stderr)
                time.sleep(5 * (attempt + 1))
        p = os.path.join(outdir, stem, f'seg{i:03d}.mp3')
        open(p, 'wb').write(audio)
        seg_paths.append(p)
        print(f'  seg{i:03d} [{role}]: {len(c)} chars -> {len(audio)//1024} KB')
    return seg_paths

BITRATES = {1: 32, 2: 40, 3: 48, 4: 56, 5: 64, 6: 80, 7: 96, 8: 112,
            9: 128, 10: 160, 11: 192, 12: 224, 13: 256, 14: 320}

def _strip_mp3(data):
    """Drop ID3v2 tag and any Xing/Info metadata frame so raw-joined
    segments read as one continuous CBR stream with correct duration."""
    if data[:3] == b'ID3':
        size = ((data[6] & 0x7f) << 21) | ((data[7] & 0x7f) << 14) | \
               ((data[8] & 0x7f) << 7) | (data[9] & 0x7f)
        data = data[10 + size:]
    # examine the first MPEG frame; skip it if it is a Xing/Info header frame
    if len(data) > 4 and data[0] == 0xff and (data[1] & 0xe0) == 0xe0:
        br = BITRATES.get((data[2] >> 4) & 0x0f)
        sr = {0: 44100, 1: 48000, 2: 32000}.get((data[2] >> 2) & 0x03)
        if br and sr:
            flen = (144 * br * 1000) // sr + ((data[2] >> 1) & 0x01)
            frame = data[:flen]
            if b'Xing' in frame or b'Info' in frame:
                data = data[flen:]
    return data

def concat(seg_paths, out_path):
    try:
        lst = out_path + '.txt'
        open(lst, 'w').write('\n'.join(f"file '{os.path.abspath(p)}'" for p in seg_paths))
        subprocess.run(['ffmpeg', '-y', '-f', 'concat', '-safe', '0', '-i', lst,
                        '-c', 'copy', out_path], check=True, capture_output=True)
        os.unlink(lst)
    except (FileNotFoundError, subprocess.CalledProcessError):
        with open(out_path, 'wb') as out:      # MP3-aware raw concat
            for p in seg_paths:
                out.write(_strip_mp3(open(p, 'rb').read()))
    print(f'wrote {out_path}')

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('script')
    ap.add_argument('--voice', default=os.environ.get('ELEVENLABS_VOICE_ID'))
    ap.add_argument('--quote-voice', default=os.environ.get('ELEVENLABS_QUOTE_VOICE_ID'))
    ap.add_argument('--model', default='eleven_multilingual_v2')
    ap.add_argument('--out', default='out')
    ap.add_argument('--quote-min', type=int, default=0,
                    help='optional extra gate: min chars for the voice switch (0 = citation-driven only)')
    a = ap.parse_args()
    key = os.environ.get('ELEVENLABS_API_KEY')
    if not key:
        keyfile = os.path.expanduser('~/.elevenlabs.key')
        if os.path.exists(keyfile):
            key = open(keyfile).read().strip()
    if not key or not a.voice:
        sys.exit('need ELEVENLABS_API_KEY env (or ~/.elevenlabs.key) and --voice/ELEVENLABS_VOICE_ID')
    stem = os.path.splitext(os.path.basename(a.script))[0]
    chunks = chunk(parse_script(a.script), quote_min=a.quote_min)
    print(f'{stem}: {len(chunks)} chunks, {sum(len(c) for _, c in chunks):,} chars')
    voices = {'narrator': a.voice, 'scripture': a.quote_voice or a.voice}
    segs = tts(chunks, voices, a.model, key, a.out, stem)
    concat(segs, os.path.join(a.out, stem + '.mp3'))
