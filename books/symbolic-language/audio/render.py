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
BREAKS = {'[beat]': '<break time="0.3s" />',
          '[pause]': '<break time="0.7s" />',
          '[long pause]': '<break time="1.2s" />'}

def parse_script(path):
    raw = open(path, encoding='utf-8').read()
    m = re.match(r'\A---\s*\n.*?\n---\s*\n(.*)\Z', raw, re.S)
    body = m.group(1) if m else raw
    out_lines = []
    for line in body.split('\n'):
        if re.match(r'^(\[quote[^\]]*\]|____)\s*$', line):
            continue                       # quote framing is a voice direction, not speech
        out_lines.append(line)
    text = '\n'.join(out_lines)
    # asciidoc emphasis -> plain words (ElevenLabs stresses from punctuation/context)
    text = re.sub(r'__([^_]+)__', r'\1', text)
    text = re.sub(r'\*([^*]+)\*', r'\1', text)
    text = re.sub(r'_([a-zA-Zāēīōū\'-]+)_', r'\1', text)   # transliterated terms
    text = text.replace('…', '...').replace('“', '"').replace('”', '"').replace('’', "'")
    return text

def chunk(text):
    # split on [long pause]; re-pack greedily under MAX_CHARS
    parts = [p.strip() for p in text.split('[long pause]') if p.strip()]
    chunks, cur = [], ''
    for p in parts:
        candidate = (cur + '\n' + BREAKS['[long pause]'] + '\n' + p) if cur else p
        if len(candidate) > MAX_CHARS and cur:
            chunks.append(cur)
            cur = p
        else:
            cur = candidate
    if cur:
        chunks.append(cur)
    return [apply_breaks(c) for c in chunks]

def apply_breaks(c):
    for k, v in BREAKS.items():
        c = c.replace(k, v)
    return c

def tts(chunks, voice, model, key, outdir, stem):
    seg_paths = []
    os.makedirs(os.path.join(outdir, stem), exist_ok=True)
    for i, c in enumerate(chunks):
        body = {'text': c, 'model_id': model,
                'previous_text': chunks[i-1][-500:] if i > 0 else None,
                'next_text': chunks[i+1][:500] if i + 1 < len(chunks) else None,
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
            except Exception as e:
                if attempt == 2:
                    raise
                print(f'  seg{i:03d} retry after error: {e}', file=sys.stderr)
                time.sleep(5 * (attempt + 1))
        p = os.path.join(outdir, stem, f'seg{i:03d}.mp3')
        open(p, 'wb').write(audio)
        seg_paths.append(p)
        print(f'  seg{i:03d}: {len(c)} chars -> {len(audio)//1024} KB')
    return seg_paths

def concat(seg_paths, out_path):
    try:
        lst = out_path + '.txt'
        open(lst, 'w').write('\n'.join(f"file '{os.path.abspath(p)}'" for p in seg_paths))
        subprocess.run(['ffmpeg', '-y', '-f', 'concat', '-safe', '0', '-i', lst,
                        '-c', 'copy', out_path], check=True, capture_output=True)
        os.unlink(lst)
    except (FileNotFoundError, subprocess.CalledProcessError):
        with open(out_path, 'wb') as out:      # raw concat fallback
            for p in seg_paths:
                out.write(open(p, 'rb').read())
    print(f'wrote {out_path}')

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('script')
    ap.add_argument('--voice', default=os.environ.get('ELEVENLABS_VOICE_ID'))
    ap.add_argument('--model', default='eleven_multilingual_v2')
    ap.add_argument('--out', default='out')
    a = ap.parse_args()
    key = os.environ.get('ELEVENLABS_API_KEY')
    if not key or not a.voice:
        sys.exit('need ELEVENLABS_API_KEY env and --voice/ELEVENLABS_VOICE_ID')
    stem = os.path.splitext(os.path.basename(a.script))[0]
    chunks = chunk(parse_script(a.script))
    print(f'{stem}: {len(chunks)} chunks, {sum(len(c) for c in chunks):,} chars')
    segs = tts(chunks, a.voice, a.model, key, a.out, stem)
    concat(segs, os.path.join(a.out, stem + '.mp3'))
