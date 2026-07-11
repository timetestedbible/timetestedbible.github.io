#!/usr/bin/env python3
"""Stills-first storyboard draft: compose a chapter video from the timed
scene list in storyboards/<stem>.md — one static bed image per scene,
crossfades at scene starts, full caption/quote-card/title track from
video.py (imported, not modified). For author review before any animation
pass.

Usage: out/venv/bin/python storyboard_stills.py 09-the-seal
Output: out/<stem>-storyboard.mp4
"""
import argparse, os, re, sys

import render
import video

HERE = os.path.dirname(os.path.abspath(__file__))

SCENE_RE = re.compile(r'^### (s\d+) · ([\d.]+)–([\d.]+)', re.M)


def parse_storyboard(md_path):
    body = open(md_path, encoding='utf-8').read()
    scenes = []
    blocks = list(re.finditer(r'^### (s\d+) · ([\d.]+)–([\d.]+)'
                              r'[^\n]*\n(.*?)(?=^### |\Z)', body, re.M | re.S))
    for m in blocks:
        img = re.search(r'- image: (\S+)', m.group(4)).group(1)
        scenes.append({'id': m.group(1), 't0': float(m.group(2)),
                       't1': float(m.group(3)),
                       'img': os.path.join(HERE, img)})
    assert scenes and scenes[0]['t0'] == 0.0, 'first scene must start at 0'
    for a, b in zip(scenes, scenes[1:]):
        assert abs(a['t1'] - b['t0']) < 0.05, \
            f'scene gap {a["id"]}->{b["id"]}: {a["t1"]} vs {b["t0"]}'
    return scenes


def still_clip(ff, img, n, outdir, tag, size):
    # cache key includes the image identity (name + mtime) and frame size
    # so regenerated/fallback beds and previews never reuse a stale clip
    w, h = size
    key = f'{os.path.basename(img)}-{int(os.path.getmtime(img))}'
    clip = os.path.join(outdir, f'sb-{tag}-{key}-n{n}-{w}x{h}.mp4')
    if not os.path.exists(clip):
        video.run([ff, '-y', '-loop', '1', '-framerate', str(video.FPS),
                   '-i', img, '-vf',
                   f'scale={w}:{h}:'
                   f'force_original_aspect_ratio=increase:flags=lanczos,'
                   f'crop={w}:{h},format=yuv420p',
                   '-frames:v', str(n)] + video.venc_args(ff) + [clip])
    return clip


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('stem')
    ap.add_argument('--model', default='small.en')
    ap.add_argument('--preview', action='store_true',
                    help='render at 720p for fast author-review iteration; '
                         'the approved final gets a full 1080p render')
    a = ap.parse_args()
    stem = re.sub(r'\.adoc$', '', os.path.basename(a.stem))
    size = (1280, 720) if a.preview else (video.W, video.H)
    out = os.path.join(HERE, 'out')

    scenes = parse_storyboard(os.path.join(HERE, 'storyboards', stem + '.md'))
    missing = [s['id'] for s in scenes if not os.path.exists(s['img'])]
    # fall back to the nearest earlier available image so a draft still renders
    last = None
    for s in scenes:
        if os.path.exists(s['img']):
            last = s['img']
        elif last:
            print(f'  {s["id"]}: image missing, reusing previous bed')
            s['img'] = last
    if missing:
        print(f'WARNING: missing images for {missing}')

    script = os.path.join(HERE, stem + '.adoc')
    audio = os.path.join(out, stem + '.mp3')
    segdir = os.path.join(out, stem)
    fm = open(script, encoding='utf-8').read()
    m = re.search(r'^audio-of:\s*(\S+)', fm, re.M)
    print_twin = os.path.join(HERE, '..', m.group(1)) if m else script

    chunks = render.chunk(render.parse_script(script))
    segs = sorted(f for f in os.listdir(segdir)
                  if re.fullmatch(r'seg\d+\.mp3', f))
    assert len(segs) == len(chunks), f'{len(segs)} segs vs {len(chunks)} chunks'
    bounds = [0.0]
    for f in segs:
        bounds.append(bounds[-1] + video.ffprobe_duration(os.path.join(segdir, f)))
    total = video.ffprobe_duration(audio)

    words = video.whisper_words(audio, os.path.join(out, stem + '.align.json'),
                                a.model)
    pieces = video.chunk_pieces(chunks)
    events, _ = video.build_events(chunks, pieces, words, bounds, script,
                                   print_twin,
                                   scene_starts=[s['t0'] for s in scenes])

    ff = video.ffmpeg_bin()
    print_stem = os.path.splitext(os.path.basename(print_twin))[0]
    intro = video.intro_clip(ff, print_stem, segdir, size=size)
    starts = [s['t0'] for s in scenes] + [total]
    if intro:
        # branded card holds 0..INTRO while the chapter title is spoken;
        # scene 1 crossfades in after it (its clip starts at INTRO)
        events = [e for e in events
                  if not (e['kind'] == 'title' and e['s'] < video.INTRO)]
        assert starts[1] > video.INTRO + video.XFADE, 'scene 2 inside intro'
        starts[0] = video.INTRO
    ass_path = os.path.join(out, stem + '-storyboard.ass')
    video.write_ass(events, ass_path)

    clips = []
    for i, s in enumerate(scenes):
        dur = (starts[i + 1] - starts[i]) + \
              (video.XFADE if i + 1 < len(scenes) else 0.0)
        print(f'  {s["id"]}: {os.path.basename(s["img"])} {dur:.1f}s')
        clips.append(still_clip(ff, s['img'], round(dur * video.FPS), segdir,
                                s['id'], size))
    offsets = starts[:-1]
    if intro:
        clips, offsets = [intro] + clips, [0.0] + offsets
    out_mp4 = os.path.join(out, stem + '-storyboard.mp4')
    video.compose(ff, clips, offsets, ass_path, audio, total, out_mp4,
                  brand=video.brand_overlay(out),
                  brand_from=video.INTRO if intro else 0.0,
                  docks=[(e['s'], e['e']) for e in events
                         if e['kind'] == 'dock'],
                  size=size)
    print(f'wrote {out_mp4} ({video.ffprobe_duration(out_mp4):.1f}s, '
          f'audio {total:.1f}s, {len(scenes)} scenes)')


if __name__ == '__main__':
    main()
