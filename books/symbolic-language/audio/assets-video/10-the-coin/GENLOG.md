# Generation log — Chapter 10 (The Coin) bed images

Run date: 2026-07-10. Source prompts: storyboards/10-the-coin.md (15 scenes).
Recipe: OpenAI Images API via `python3 storyboard_images.py 10-the-coin`
(gpt-image-1, 1536x1024 landscape, quality high, ~$0.25/scene) -> Upscayl 4x
with CHAPTER-PREFIXED cache names (out/upscaled/10-the-coin-scene-NN-4x.png —
avoids the scene-NN collision noted in 01-introduction's GENLOG) -> ffmpeg
lanczos cover+crop to 1920x1080 -> assets-video/10-the-coin/scene-NN.png.
Raw API natives kept beside the beds in native/. Tone reference:
assets-video/09-the-seal-bed.png; red accent only on scenes 10-12 per the
storyboard (blood on the doorposts / seal-mark on the brow / struck mark on
the hand); all other scenes pinned strictly monochrome-sepia; no-text rule
appended to every prompt.

15/15 scenes succeeded on the first attempt — no retries, no failures.
All beds verified 1920x1080.

| Scene | Result | API time | Native size |
|---|---|---|---|
| scene-01 | OK | 45s | 2354 KB |
| scene-02 | OK | 46s | 3079 KB |
| scene-03 | OK | 51s | 2801 KB |
| scene-04 | OK | 48s | 3182 KB |
| scene-05 | OK | 50s | 2318 KB |
| scene-06 | OK | 48s | 2346 KB |
| scene-07 | OK | 48s | 3459 KB |
| scene-08 | OK | 51s | 3579 KB |
| scene-09 | OK | 47s | 3240 KB |
| scene-10 | OK | 44s | 3054 KB |
| scene-11 | OK | 45s | 3210 KB |
| scene-12 | OK | 51s | 2328 KB |
| scene-13 | OK | 51s | 3391 KB |
| scene-14 | OK | 47s | 2543 KB |
| scene-15 | OK | 60s | 2798 KB |

Notes:
- Audio: out/10-the-coin.mp3 (1353.0s, 31 segments, voices
  nPczCjzI2devNBz1zQrb narrator / JBFqnCBsd6RMkjVDRZzb scripture).
- Stills draft: out/10-the-coin-storyboard.mp4 (1353.0s, 15 scenes; events:
  254 captions, 15 quote cards, 8 title cards, 20 inline chips).
- Review flag for the author: scene-03's questioners include a central
  bearded figure rendered face-on that a viewer could take for Jesus; the
  coin-holder is correctly hands-only. Regenerate with
  `python3 storyboard_images.py 10-the-coin --scenes 3 --force` if it reads
  wrong.
