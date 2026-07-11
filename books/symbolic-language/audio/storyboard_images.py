#!/usr/bin/env python3
"""Generate a chapter's storyboard scene beds via the OpenAI Images API
(gpt-image-1, landscape 1536x1024) — the API path replaces codex exec
(faster: ~50s/scene, and size is explicit).

Reads scene prompts from storyboards/<stem>.md. Both storyboard formats
are understood:
  numbered draft:  "NN. [Section] — beat :: IMAGE: <prompt>"
  timed scene map: "### sNN · T0–T1 ..." blocks with "- prompt: <prompt>"

Standing style rules (storyboard header): prompts already carry the
black-and-white Rembrandt-etching suffix; this script appends the no-text
rule to every prompt and pins strict monochrome on scenes that do not
declare their own accent (a red accent for blood/stamp/mark/seal subjects,
or a warm gold gleam on in-focus metal like the coin).

Chain per scene (per the audiobook-video-pipeline memory):
  API png (native, kept beside the bed)     assets-video/<stem>/native/scene-NN.png
  Upscayl 4x, chapter-prefixed cache name   out/upscaled/<stem>-scene-NN-4x.png
  lanczos cover+crop to 1920x1080           assets-video/<stem>/scene-NN.png

assets-video/ is local-only (gitignored): commit the storyboard md +
GENLOG, never the imagery. API key: ~/.gptapi.key (never printed).

Usage:
  python3 storyboard_images.py 10-the-coin [--scenes 3,7] [--dry-run]
"""
import argparse, base64, json, os, re, subprocess, sys, time
import urllib.error, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
UPSCALED = os.path.join(HERE, 'out', 'upscaled')
UPSCAYL_BIN = '/Applications/Upscayl.app/Contents/Resources/bin/upscayl-bin'
UPSCAYL_MODELS = '/Applications/Upscayl.app/Contents/Resources/models'
KEYFILE = os.path.expanduser('~/.gptapi.key')
API = 'https://api.openai.com/v1/images/generations'

NO_TEXT = ('The image contains absolutely no text, lettering, inscriptions, '
           'captions, or watermarks of any kind.')
MONO = ('Strictly black-and-white throughout — pure black ink on white '
        'paper; no color accents anywhere, no sepia, no warm tint.')


def ffmpeg_bin():
    static = os.path.join(HERE, 'out', 'tools', 'ffmpeg')
    return static if os.path.exists(static) else '/opt/homebrew/bin/ffmpeg'


def parse_scenes(md_path):
    """[(nn, prompt)] from either storyboard format."""
    body = open(md_path, encoding='utf-8').read()
    scenes = [(int(m.group(1)), m.group(2).strip())
              for m in re.finditer(r'^(\d+)\.\s+\[[^\]]*\][^\n]*?::\s*IMAGE:\s*(.+)$',
                                   body, re.M)]
    if not scenes:
        for m in re.finditer(r'^### s(\d+) ·.*?\n(.*?)(?=^### |\Z)',
                             body, re.M | re.S):
            p = re.search(r'- prompt:\s*(.+?)(?=\n- |\n\n|\Z)', m.group(2), re.S)
            if p:
                scenes.append((int(m.group(1)),
                               re.sub(r'\s+', ' ', p.group(1)).strip()))
    return scenes


def build_prompt(prompt):
    parts = [prompt.rstrip()]
    if not re.search(r'(red|gold) accent', prompt, re.I):
        parts.append(MONO)
    parts.append(NO_TEXT)
    return ' '.join(parts)


def generate(prompt, size, quality, key):
    req = urllib.request.Request(API, data=json.dumps(
        {'model': 'gpt-image-1', 'prompt': prompt,
         'size': size, 'quality': quality}).encode(),
        headers={'Authorization': f'Bearer {key}',
                 'Content-Type': 'application/json'})
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=600) as r:
        resp = json.load(r)
    return (base64.b64decode(resp['data'][0]['b64_json']),
            time.time() - t0, resp.get('usage', {}))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('stem', help='chapter stem, e.g. 10-the-coin')
    ap.add_argument('--scenes', help='comma-separated subset, e.g. 3,7')
    ap.add_argument('--size', default='1536x1024')
    ap.add_argument('--quality', default='high',
                    choices=['low', 'medium', 'high'])
    ap.add_argument('--force', action='store_true',
                    help='regenerate scenes whose bed already exists')
    ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()
    stem = re.sub(r'\.adoc$', '', os.path.basename(a.stem))

    scenes = parse_scenes(os.path.join(HERE, 'storyboards', stem + '.md'))
    if not scenes:
        sys.exit(f'no scenes found in storyboards/{stem}.md')
    if a.scenes:
        keep = {int(s) for s in a.scenes.split(',')}
        scenes = [s for s in scenes if s[0] in keep]

    outdir = os.path.join(HERE, 'assets-video', stem)
    native_dir = os.path.join(outdir, 'native')
    key = None
    if not a.dry_run:
        os.makedirs(native_dir, exist_ok=True)
        os.makedirs(UPSCALED, exist_ok=True)
        key = open(KEYFILE, encoding='utf-8').read().strip()
    ff = ffmpeg_bin()
    ok = 0
    for nn, raw in scenes:
        prompt = build_prompt(raw)
        bed = os.path.join(outdir, f'scene-{nn:02d}.png')
        if a.dry_run:
            print(f'--- scene-{nn:02d}\n{prompt}\n')
            continue
        if os.path.exists(bed) and not a.force:
            print(f'scene-{nn:02d}: exists, skipping (--force to redo)')
            ok += 1
            continue
        native = os.path.join(native_dir, f'scene-{nn:02d}.png')
        try:
            img, dt, usage = generate(prompt, a.size, a.quality, key)
        except urllib.error.HTTPError as e:
            print(f'scene-{nn:02d}: API ERROR {e.code}: '
                  f'{e.read().decode(errors="replace")[:400]}', flush=True)
            continue
        except Exception as e:
            print(f'scene-{nn:02d}: ERROR {e}', flush=True)
            continue
        open(native, 'wb').write(img)
        # Upscayl 4x — cache name is CHAPTER-PREFIXED (plain scene-NN-4x
        # collides across chapters; see 01-introduction GENLOG caveat)
        up = os.path.join(UPSCALED, f'{stem}-scene-{nn:02d}-4x.png')
        r = subprocess.run([UPSCAYL_BIN, '-i', native, '-o', up, '-s', '4',
                            '-m', UPSCAYL_MODELS, '-n', 'upscayl-standard-4x'],
                           capture_output=True, text=True)
        src = up if r.returncode == 0 and os.path.exists(up) else native
        if src is native:
            print(f'scene-{nn:02d}: upscayl failed, lanczos from native')
        r = subprocess.run([ff, '-y', '-i', src, '-vf',
                            'scale=1920:1080:force_original_aspect_ratio='
                            'increase:flags=lanczos,crop=1920:1080',
                            bed], capture_output=True, text=True)
        if r.returncode != 0 or not os.path.exists(bed):
            print(f'scene-{nn:02d}: ffmpeg FAILED: {r.stderr[-300:]}')
            continue
        ok += 1
        ti, to = usage.get('input_tokens', 0), usage.get('output_tokens', 0)
        print(f'scene-{nn:02d}: OK {dt:.0f}s api, {len(img)//1024} KB native, '
              f'tokens in={ti} out={to} (~${ti*5/1e6 + to*40/1e6:.2f}) -> {bed}',
              flush=True)
    if not a.dry_run:
        print(f'{ok}/{len(scenes)} scenes on disk in {outdir}')


if __name__ == '__main__':
    main()
