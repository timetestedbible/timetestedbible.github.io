# Storyboard — Chapter 10: The Coin

Timed scene list for the video edition (audio: out/10-the-coin.mp3, 1353.0s).
Windows are seconds into the chapter audio, anchored on whisper word times
(out/10-the-coin.align.json) at each beat's opening phrase; scene switches
crossfade at the window start.

Images are generated per scene (local-only, assets-video/10-the-coin/ is
gitignored); this file is the source of truth for regenerating them.
Recipe: OpenAI Images API via storyboard_images.py (gpt-image-1, landscape
1536x1024, quality high) -> Upscayl 4x with CHAPTER-PREFIXED cache names
(out/upscaled/10-the-coin-scene-NN-4x.png) -> lanczos cover+crop to
1920x1080 -> assets-video/10-the-coin/scene-NN.png. Regenerate any scene:

    python3 storyboard_images.py 10-the-coin --scenes NN --force

Style suffix carried by every prompt: monochrome-sepia
photographic-painterly, lighter exposure, warm tone, 16:9.
Rules: no legible text in any image (inscriptions suggested by fine strokes
only); Jesus never shown face-on (hands, feet, silhouette, from-behind
only); red accent only where a seal/mark/blood/scarlet element is itself
the subject — otherwise strictly monochrome-sepia (storyboard_images.py
pins strict monochrome on every scene without a declared accent, and
appends the no-text rule to all).

### s01 · 0.0–28.3 · The woman sweeps for the coin
- section: Chapter opening
- image: assets-video/10-the-coin/scene-01.png
- beat: Title; "render unto Caesar" epigraph; Jesus defines the symbol Himself — Luke 15:8-10 quote card: ten silver coins, the lamp, the sweeping, the search.
- prompt: A woman in a dark stone-floored house sweeping by the glow of a single oil lamp, bending toward a faint glint of silver between the flagstones — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s02 · 28.3–102.0 · Rejoice with me
- section: Chapter opening
- image: assets-video/10-the-coin/scene-02.png
- beat: "Rejoice with me, for I have found the piece which I lost"; the equation — the found coin IS the repenting sinner; the house of Israel, the ten tribes, the lamp of the commandment decoded.
- prompt: The woman at her lamplit doorway holding one small silver coin up to friends and neighbors pressing in with lifted, joyful faces — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s03 · 102.0–276.7 · The coin of the census
- section: The Coin of the Census
- image: assets-video/10-the-coin/scene-03.png
- beat: The trap; Matthew 22:15-21 quote card; image and inscription = the image and name of the beast; render unto Caesar divides the world's estate; whose image do YOU bear; the pivot — what coin bears the image of God?
- prompt: A single denarius held up between thumb and forefinger toward the light before a knot of robed questioners, its stamped ruler's profile and rim of worn strokes catching the sun, the holder seen only as a hand and sleeve — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s04 · 276.7–303.6 · Ore from the field
- section: The Mint
- image: assets-video/10-the-coin/scene-04.png
- beat: A coin is the seal made money — dug from a field, refined in fire, stamped with the name; the field is the world; what the buyer found was ore.
- prompt: A man knee-deep in a dug pit in a wide field at dawn, lifting a clod threaded with veins of raw gold ore, spade and mattock beside him — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s05 · 303.6–353.4 · Refined as silver
- section: The Mint
- image: assets-video/10-the-coin/scene-05.png
- beat: Ore is not spent; it is refined — the refining is the trial; Job's gold; Zechariah 13:9 quote card — "they shall call on my name"; refined, then stamped with the seal.
- prompt: A refiner bent over a glowing crucible in a dark smithy, molten silver brightening in the flame as dross curls away at the lip — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s06 · 353.4–432.4 · The market of the truth
- section: What His Coin Buys
- image: assets-video/10-the-coin/scene-06.png
- beat: "Buy the truth, and sell it not"; Proverbs 2:3-6 quote card — sought as silver, hid treasures, out of his mouth; "buy of me gold tried in the fire"; the market vocabulary carried to the strangest coin-scene.
- prompt: A seeker at a night-market counter pushing a small bag of silver toward an aged merchant whose only wares are unrolled scrolls lit by an oil lamp — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s07 · 432.4–530.5 · The fish that carries it
- section: The Fish That Carries It
- image: assets-video/10-the-coin/scene-07.png
- beat: Matthew 17:24-27 quote card; the fish is the one symbol the world still reads; Peter the fisher of men, the sea of nations, the first fish up with silver in its mouth; "then are the sons free."
- prompt: Peter kneeling on a wet stone shore prying open the mouth of a freshly caught fish where a broad silver stater gleams, hook and line beside him and the sea behind — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s08 · 530.5–625.2 · The half-shekel ransom
- section: The Census and Its Ransom
- image: assets-video/10-the-coin/scene-08.png
- beat: Exodus 30:12,15 quote card — every counted head owes a ransom for his soul; the rich not more, the poor not less; "in that number"; Job 34:19 — no respecter of persons.
- prompt: A long file of counted men passing a table at the tabernacle court, each dropping one identical half-shekel into a bronze basin before Levite recorders — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s09 · 625.2–675.8 · Sockets of redemption silver
- section: The Census and Its Ransom
- image: assets-video/10-the-coin/scene-09.png
- beat: The money is called a memorial; the census silver cast into the sanctuary sockets — God's house stood on the ransom-money of His counted people; lively stones, a spiritual house.
- prompt: Workmen lowering a gilded tabernacle board into a row of massive cast-silver sockets gleaming against the desert floor — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s10 · 675.8–851.1 · The marked doors
- section: The Census and Its Ransom
- image: assets-video/10-the-coin/scene-10.png
- beat: The census began at the door in Egypt — the firstborn bought with the lamb's blood; Exodus 13:2 quote card; the womb opens again in Revelation; Exodus 13:9 quote card — hand, eyes, mouth; the number of their names; the fish's riddle answered — the confession in the mouth; the stater = two ransoms, be'ad us.
- prompt: A doorway in Egypt at dusk, lintel and both posts freshly marked with lamb's blood, a family gathered around lamplight within; red accent: the blood on the doorposts, the only color in the frame — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s11 · 851.1–906.7 · God counts first
- section: The Mark of the Beast
- image: assets-video/10-the-coin/scene-11.png
- beat: Two enrollments set side by side; Revelation 7:4 quote card — the number of the sealed, tribe by tribe like Sinai's; alaphim/alluphim — a census of firstborn, the firstfruits.
- prompt: Ranked companies standing tribe by tribe on a wide plain while a radiant messenger moves along the ranks pressing a seal to each forehead; red accent: the fresh seal-mark on the nearest brow, the only color in the frame — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s12 · 906.7–1050.0 · The beast counts
- section: The Mark of the Beast
- image: assets-video/10-the-coin/scene-12.png
- beat: Revelation 13:16-18 quote card; the counterfeit census member for member; charagma is mint vocabulary — the man who takes the mark is minted; rich and poor, the equality clause kept; the registers face each other; the plague clause inverts.
- prompt: A dark marketplace queue where each buyer stretches out a right hand to a seated official striking it with a coiner's die, scales and wares crowding the tables; red accent: the fresh struck mark on the foremost hand, the only color in the frame — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s13 · 1050.0–1113.5 · Without money and without price
- section: The Mark of the Beast
- image: assets-video/10-the-coin/scene-13.png
- beat: Babylon's market cannot starve the sealed — Isaiah 55:1 quote card; the beast's enrollment is older than Rome — Genesis 11:4 quote card, Babel's counter-covenant name; two names, two censuses, two coinages.
- prompt: An open stall beside flowing waters where a robed seller hands bread and a brimming cup freely to ragged comers with empty upturned palms — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s14 · 1113.5–1326.8 · The white stone and the sum
- section: The Number of One Man
- image: assets-video/10-the-coin/scene-14.png
- beat: Count the number — a covenant census problem, not gematria; psephizo, the counting-pebble; "I will give him a white stone… a new name written"; chashav, the ledger-reckoning; 666 as money (1 Kings 10:14 quote card) and as census entry (Ezra 2:13 quote card); the count returns "few."
- prompt: An open palm receiving a single smooth white counting-pebble above a table strewn with tally-pebbles and an opened census scroll, lamplight on the stone — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s15 · 1326.8–1353.0 · Fifteen pieces of silver
- section: Closing — handoff to Marriage and Divorce
- image: assets-video/10-the-coin/scene-15.png
- beat: Hosea acts the ransomed side out — "So I bought her to me for fifteen pieces of silver"; the Husband paying coin to redeem the wife who left him; the marriage itself is the next chapter.
- prompt: Hosea in a shadowed market counting fifteen pieces of silver into a trader's hand while a downcast woman stands beside him, his other hand reaching gently for hers — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.
