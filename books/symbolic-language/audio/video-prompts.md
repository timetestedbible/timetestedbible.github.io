# Generated video imagery — prompts

Generated bed images are local-only (`assets-video/` is gitignored); this file
is the source of truth for regenerating them.

Pipeline: Codex CLI (native ~1672x941) -> Upscayl 4x -> lanczos downscale.

```sh
codex exec --skip-git-repo-check --sandbox workspace-write -C /tmp \
  "Generate an image: <PROMPT>. Save it to /tmp/<name>.png"
/Applications/Upscayl.app/Contents/Resources/bin/upscayl-bin \
  -i /tmp/<name>.png -o out/upscaled/<name>-4x.png -s 4 \
  -m /Applications/Upscayl.app/Contents/Resources/models -n upscayl-standard-4x
out/tools/ffmpeg -i out/upscaled/<name>-4x.png \
  -vf "scale=1920:1080:flags=lanczos" assets-video/<name>.png
```

House style suffix (append to every subject — author, 2026-07-10): "Style:
black-and-white Rembrandt etching — fine cross-hatched line work, drypoint
burr, dramatic chiaroscuro, pure black ink on white paper, strictly
monochrome, no sepia, no color tint — overall bright enough to read as a
lit scene, not sunk in shadow. 16:9 widescreen, highest resolution
available."

Accent exceptions (declared per scene, in the prompt):
- ONE selective deep-red accent, reserved for the in-focus subject when it
  is blood / a stamp / a mark / a seal — "red accent: <subject>, the only
  color in the frame".
- A warm gold gleam is permitted on in-focus metal (the coin, the shekel,
  heaped talents) — "gold accent: <subject>, the only color in the frame".
storyboard_images.py pins strict monochrome on any scene without a declared
accent.

Standing content rules (all future scene generation):
- No legible text anywhere (inscriptions suggested by fine strokes only).
- Jesus never shown face-on (hands, feet, silhouette, from-behind only).
- NO tefillin: the Exodus 13 sign on hand and forehead is depicted as the
  book depicts it — a mark/writing on the hand and forehead — never an
  Orthodox prayer box strapped to a head (author, 2026-07-10).

Queued for the SEAL chapter's artwork (author notes, 2026-07-10):
- The priest/scribe in white linen must have a BEARD.
- The pen must mark the FOREHEAD itself, not draw into the hair.

(video.py additionally applies a uniform bed tone pass — the TONE
constant — at composite time. Its warm colorbalance matched the old sepia
beds; for strict-B&W chapters neutralize it — keep the brightness/gamma
lift, DROP the color cast — so the B&W stays B&W and the red accents stay
red. The Coin's beds predate the style change and stay sepia, with the
warm TONE.)

## assets-video/09-the-seal-bed.png

An aged hand pressing a heavy signet ring into molten sealing wax on a rolled
parchment scroll bound with cord, lit by a single candle flame at the edge of
the frame, warm candlelit glow. Composition: intimate close-up on the ring
meeting the wax, scroll diagonal across frame, dark background.
