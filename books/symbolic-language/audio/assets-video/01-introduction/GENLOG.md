# Generation log — Chapter 1 (Introduction) bed images

Run date: 2026-07-10. Source prompts: storyboards/01-introduction.md (15 scenes).
Recipe: Codex CLI (`codex exec --skip-git-repo-check --sandbox workspace-write
-C /tmp "Generate an image: <prompt> Save it to /tmp/<name>.png"`, codex-cli
0.144.1, native 1672x941) -> Upscayl 4x (`upscayl-bin -s 4 -n
upscayl-standard-4x`) -> out/upscaled/scene-NN-4x.png -> ffmpeg lanczos
1920x1080 -> assets-video/01-introduction/scene-NN.png. Per video-prompts.md;
tone reference: assets-video/10-the-seal-bed.png.

RUN HALTED BY AUTHOR after scene 12: scenes 13-15 were never attempted.
Scene 12 had already completed its full chain (generate + upscale + downscale)
when the stop order landed, so 12/15 scenes are on disk, all verified
1920x1080. No partial artifacts remain for 13-15. To finish the set, rerun
the recipe above for scenes 13-15 using the prompts in
storyboards/01-introduction.md.

| Scene | Result | Attempts | Native | Gen time | Prompt (as sent, style suffix inline) |
|---|---|---|---|---|---|
| scene-01 | OK | 1 | 1672x941 | 84s | Inside a stone synagogue at Capernaum, a broken barley loaf and a cup of wine on a rough wooden table before rows of listening townsfolk, SELECTIVE RED ACCENT on the wine in the cup only; monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9. |
| scene-02 | OK | 1 | 1672x941 | 147s | A crowd streaming out of the synagogue doorway into hard daylight while twelve men remain seated near a robed teacher seen only from behind; monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9. |
| scene-03 | OK | 1 | 1672x941 | 137s | A teacher seen from behind speaking from a small fishing boat held just offshore, a great crowd seated up the sloping beach straining to hear; monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9. |
| scene-04 | OK | 1 | 1672x941 | 132s | Men bent close over unrolled scrolls by oil-lamp light, one finger tracing a line while a second scroll is held open beside it for comparison; monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9. |
| scene-05 | OK | 1 | 1672x941 | 85s | John the Baptist standing in the Jordan shallows pointing toward a distant robed figure on the far bank, a young lamb standing in the foreground reeds; monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9. |
| scene-06 | OK | 1 | 1672x941 | 87s | Two scribes at separate tables checking written claims against one open master scroll between them, a balance scale standing on the bench, all writing suggested by fine strokes and not legible; monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9. |
| scene-07 | OK | 1 | 1672x941 | 86s | A serpent coiled through a fruit-laden tree in a lush garden, its head bent low toward a listening woman half-turned beneath the branches; monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9. |
| scene-08 | OK | 1 | 1672x941 | 79s | Withered grass and faded wildflowers bending around a stone where an unrolled scroll lies whole and untouched in warm light; monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9. |
| scene-09 | OK | 1 | 1672x941 | 73s | A long table spread with scrolls and codices of many ages — cracked leather, papyrus, fresh parchment — unrolled end to end under a single hanging lamp; monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9. |
| scene-10 | OK | 1 | 1672x941 | 89s | A weary traveler seated on the stone rim of an ancient well, seen from behind, as disciples hold out loaves to him and a clay waterpot stands abandoned nearby; monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9. |
| scene-11 | OK | 1 | 1672x941 | 150s | A mother and grown brothers waiting outside a packed doorway at dusk while inside the crowded lamplit house every face turns toward an unseen speaker; monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9. |
| scene-12 | OK | 1 | 1672x941 | 200s | A woman rocking a suspended goatskin churn between tent poles, a swaddled infant nursing at her side and butter forming at the churn's mouth; monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9. |
| scene-13 | NOT ATTEMPTED — author halt | — | — | — | An assayer's hands tipping a glowing crucible of refined silver at a small charcoal furnace, touchstone and standard weights laid out on the workbench; monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9. |
| scene-14 | NOT ATTEMPTED — author halt | — | — | — | Well-fed shepherds feasting at a spread table beside their tents while a gaunt, scattered flock noses bare ground beyond them; monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9. |
| scene-15 | NOT ATTEMPTED — author halt | — | — | — | Work-worn hands breaking a barley loaf and holding the halves out across a plain table toward the viewer, steam rising in lamplight; monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9. |

Notes:
- 12/12 attempted scenes succeeded on the first attempt; no retries, no
  scavenges, no failures.
- Upscaled 4x masters (6688x3764) live at out/upscaled/scene-NN-4x.png.
  Caveat: these generic basenames follow video.py's upscale_master cache
  convention for assets-video/01-introduction/scene-NN.png, but they would
  collide if another chapter also names its scenes scene-NN — future
  chapters should use descriptive names (as 10-the-seal's sNN-* set does)
  or a chapter-prefixed scheme.
- Thumbnail was NOT regenerated (halt landed first).
