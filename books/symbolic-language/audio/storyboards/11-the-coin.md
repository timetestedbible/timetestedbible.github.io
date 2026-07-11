# Storyboard — Chapter 11: The Coin

Timed scene list for the video edition (audio: out/11-the-coin.mp3, 1313.6s —
the 2026-07-10 re-render: epigraph cut, storytelling section transitions,
natural-English citation weaves, TTS quote/number-comma strips). Windows are
seconds into the chapter audio, anchored on whisper word times
(out/11-the-coin.align.json) at each beat's opening phrase; scene switches
crossfade at the window start.
Density rule (author): one scene per ~30-40 seconds of narration — windows
that run longer are dominated by a full-screen quote card that dims the bed.
The video opens with the branded thumbnail title card (5.5s) before s01
fades in; that card is compositing, not a scene here — windows stay in
audio time.

Recut 2026-07-10: densified from 15 to 43 scenes. The 15 original beds were
kept and renamed to their new slots (old 03→05, 04→09, 05→10, 06→12, 07→14,
08→16, 09→19, 10→21, 11→27, 12→29, 13→34, 14→37, 15→43; 01/02 unchanged) in
assets-video/11-the-coin/, native/, and out/upscaled/.

Images are generated per scene (local-only, assets-video/11-the-coin/ is
gitignored); this file is the source of truth for regenerating them.
Recipe: OpenAI Images API via storyboard_images.py (gpt-image-1, landscape
1536x1024, quality high) -> Upscayl 4x with CHAPTER-PREFIXED cache names
(out/upscaled/11-the-coin-scene-NN-4x.png) -> lanczos cover+crop to
1920x1080 -> assets-video/11-the-coin/scene-NN.png. Regenerate any scene:

    python3 storyboard_images.py 11-the-coin --scenes NN --force

Style suffix carried by every prompt: monochrome-sepia
photographic-painterly, lighter exposure, warm tone, 16:9. (This chapter
keeps its sepia beds by author decision, 2026-07-10; FUTURE chapters use
the strict black-and-white Rembrandt-etching style in video-prompts.md.)
Rules: no legible text in any image (inscriptions suggested by fine strokes
only); Jesus never shown face-on (hands, feet, silhouette, from-behind
only); red accent only where a seal/mark/blood/scarlet element is itself
the subject — otherwise strictly monochrome (storyboard_images.py
pins strict monochrome on every scene without a declared accent, and
appends the no-text rule to all); NO tefillin — the Exodus 13 sign is a
mark on hand and forehead, never a strapped box (s23 regenerated
2026-07-10 for this).

### s01 · 0.0–18.1 · The woman sweeps for the coin
- section: Chapter opening
- image: assets-video/11-the-coin/scene-01.png
- beat: Title (no epigraph — epigraphs are not read in audio); Jesus defines the symbol Himself — Luke 15:8-10 quote card: ten silver coins, the lamp, the sweeping, the search.
- prompt: A woman in a dark stone-floored house sweeping by the glow of a single oil lamp, bending toward a faint glint of silver between the flagstones — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s02 · 18.1–31.5 · Rejoice with me
- section: Chapter opening
- image: assets-video/11-the-coin/scene-02.png
- beat: "And when she has found it… Rejoice with me, for I have found the piece which I lost"; joy over one sinner who repents.
- prompt: The woman at her lamplit doorway holding one small silver coin up to friends and neighbors pressing in with lifted, joyful faces — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s03 · 31.5–61.2 · The found coin is the sinner
- section: Chapter opening
- image: assets-video/11-the-coin/scene-03.png
- beat: The equation stated in the last line — the found coin IS the repenting sinner, the same celebration that met the prodigal son; the mystery it unlocks runs out to Revelation's mark, image, name, and number.
- prompt: A father running to embrace his ragged returning son on the road before a lamplit farmhouse, servants hurrying behind with a robe and a ring — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s04 · 61.2–87.6 · The lamp of the commandment
- section: Chapter opening
- image: assets-video/11-the-coin/scene-04.png
- beat: Decode the furniture — the house of Israel, ten coins for ten tribes, the lamp is the commandment, its light the commandment lived; the lost sought by the light of the law.
- prompt: A single clay oil lamp burning low over an unrolled scroll on a swept stone floor, the scroll's columns suggested by faint strokes only, warm light pooling in the dark room — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s05 · 87.6–141.1 · The coin of the census
- section: The Coin of the Census
- image: assets-video/11-the-coin/scene-05.png
- beat: Section title; the trap; Matthew 22:15-21 quote card (dims the bed for most of the window).
- prompt: A single denarius held up between thumb and forefinger toward the light before a knot of robed questioners, its stamped ruler's profile and rim of worn strokes catching the sun, the holder seen only as a hand and sleeve — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s06 · 141.1–178.7 · Image and inscription
- section: The Coin of the Census
- image: assets-video/11-the-coin/scene-06.png
- beat: Where our Bibles say tax money the Greek is the coin of the census; the coin carries an image and a name; a beast is a kingdom, a kingdom stamps its money — the image and name of the beast, face-up in His hand.
- prompt: An extreme close-up of a worn silver denarius held between thumb and forefinger against low sun, the stamped laureled profile sharp, the rim inscription suggested by fine worn strokes only — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s07 · 178.7–221.4 · Whose image do you bear
- section: The Coin of the Census
- image: assets-video/11-the-coin/scene-07.png
- beat: Read without the symbols, "render unto Caesar" is a mirror; read with them it divides the world's estate by image and inscription; God created man in his own image — present your bodies.
- prompt: A man studying his own face in a polished bronze hand-mirror by lamplight, a single coin lying face-up on the table beneath it — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s08 · 221.4–251.5 · What coin bears the image of God
- section: The Coin of the Census
- image: assets-video/11-the-coin/scene-08.png
- beat: The pivot — if Caesar has a coin bearing his image, inscription, census, what coin bears the image, seal, name, and number of God? We are His coinage — minted, spent, carried, counted, counterfeited.
- prompt: Open cupped hands lifting a small bright silver coin into a shaft of light falling from above, the light washing over the palms against deep shadow — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s09 · 251.5–278.3 · Ore from the field
- section: The Mint
- image: assets-video/11-the-coin/scene-09.png
- beat: A coin is the seal made money — dug from a field, refined in fire, stamped with the name; the field is the world; what the buyer found was ore.
- prompt: A man knee-deep in a dug pit in a wide field at dawn, lifting a clod threaded with veins of raw gold ore, spade and mattock beside him — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s10 · 278.3–311.7 · Refined as silver
- section: The Mint
- image: assets-video/11-the-coin/scene-10.png
- beat: Ore is not spent, it is refined — the refining is the trial; Job's gold; Zechariah 13:9 quote card — "they shall call on my name."
- prompt: A refiner bent over a glowing crucible in a dark smithy, molten silver brightening in the flame as dross curls away at the lip — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s11 · 311.7–327.5 · Refined, then stamped
- section: The Mint
- image: assets-video/11-the-coin/scene-11.png
- beat: Those who come through the fire call on the Name and God claims them; the stamp is the seal the last chapter defined — the Name written, the law sealed in the man.
- prompt: A minter's bench in half-light, a heavy bronze die and mallet poised over a glowing silver blank on the anvil, tongs and struck coins at the edge of the lamplight — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s12 · 327.5–374.9 · The market of the truth
- section: What His Coin Buys
- image: assets-video/11-the-coin/scene-12.png
- beat: Section title; "Buy the truth, and sell it not"; Proverbs 2:3-6 quote card — sought as silver, hid treasures, out of his mouth.
- prompt: A seeker at a night-market counter pushing a small bag of silver toward an aged merchant whose only wares are unrolled scrolls lit by an oil lamp — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s13 · 374.9–404.8 · Gold tried in the fire
- section: What His Coin Buys
- image: assets-video/11-the-coin/scene-13.png
- beat: The treasure-hid-in-a-field parable in proverb form, centuries early; "I counsel thee to buy of me gold tried in the fire" — He sells exactly what His mint produces; mark the vocabulary — silver, treasure, a mouth.
- prompt: A humble traveler at a merchant's counter lit by a small forge fire, the seller seen only as hands and sleeve offering a fire-brightened ingot of gold across the boards — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s14 · 404.8–451.3 · The fish that carries it
- section: The Fish That Carries It
- image: assets-video/11-the-coin/scene-14.png
- beat: Section title; Matthew 17:24-27 quote card (dims the bed for most of the window) — the half-shekel, the first fish, the shekel in its mouth, "for me and thee."
- prompt: Peter kneeling on a wet stone shore prying open the mouth of a freshly caught fish where a broad silver stater gleams, hook and line beside him and the sea behind — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s15 · 451.3–492.7 · Fisher of men, sea of nations
- section: The Fish That Carries It
- image: assets-video/11-the-coin/scene-15.png
- beat: The fish is the one symbol the world still reads — the fish is a believer; Peter the fisher of men goes to the sea, the first fish up carries silver in its mouth; the sons are free, yet He pays — not a market price but a statute.
- prompt: A fishing boat on a wide dawn sea, men straining to haul a living net of fish over the gunwale, one bright fish lifted first above the churning catch — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s16 · 492.7–536.8 · The half-shekel ransom
- section: The Census and Its Ransom
- image: assets-video/11-the-coin/scene-16.png
- beat: Section title; the law prices persons in silver as statute; Exodus 30:12,15 quote card — a ransom for his soul, no plague, rich not more, poor not less.
- prompt: A long file of counted men passing a table at the tabernacle court, each dropping one identical half-shekel into a bronze basin before Levite recorders — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s17 · 536.8–559.3 · In that number
- section: The Census and Its Ransom
- image: assets-video/11-the-coin/scene-17.png
- beat: Every clause carries doctrine — ransomed at the counting; "Lord, how I want to be in that number" — the census of the ransomed; the price is flat.
- prompt: A long procession of robed figures seen from behind, marching up a rising road toward a radiant open gate on the crest, their line stretching back into the misted valley — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s18 · 559.3–587.7 · No respecter of persons
- section: The Census and Its Ransom
- image: assets-video/11-the-coin/scene-18.png
- beat: The tribute trap's flattery returned to its Author; Job 34:19 quote card — princes and poor alike the work of his hands; every soul the same half shekel.
- prompt: A richly robed prince and a stooped laborer side by side before one bronze basin, each hand releasing an identical small silver coin at the same moment — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s19 · 587.7–621.0 · Sockets of redemption silver
- section: The Census and Its Ransom
- image: assets-video/11-the-coin/scene-19.png
- beat: The money is called a memorial and appointed for the tabernacle; the hundred talents cast into the sanctuary sockets — God's house stood on the ransom-money of His counted people.
- prompt: Workmen lowering a gilded tabernacle board into a row of massive cast-silver sockets gleaming against the desert floor — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s20 · 621.0–632.2 · Lively stones
- section: The Census and Its Ransom
- image: assets-video/11-the-coin/scene-20.png
- beat: Peter writes — lively stones built up a spiritual house; the stone is covenant rock, a temple of covenant-people socketed in redemption silver.
- prompt: Masons setting courses of softly glowing hewn stones into a rising temple wall at dusk, each stone faintly luminous from within, silver socket-bases gleaming at the foundation line — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s21 · 632.2–665.7 · The marked doors
- section: The Census and Its Ransom
- image: assets-video/11-the-coin/scene-21.png
- beat: The census began at the door in Egypt — the firstborn bought with the lamb's blood; the fifteenth, the morrow, the sixteenth — firstfruits; Exodus 13:2 quote card — it is mine.
- prompt: A doorway in Egypt at dusk, lintel and both posts freshly marked with lamb's blood, a family gathered around lamplight within; red accent: the blood on the doorposts, the only color in the frame — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s22 · 665.7–687.3 · The womb opens again
- section: The Census and Its Ransom
- image: assets-video/11-the-coin/scene-22.png
- beat: The womb the law watched opens again in Revelation — the man child caught up to God, the dragon before the woman as Egypt's king before the firstborn; every redeemed firstborn a rehearsal.
- prompt: A radiant woman cradling her newborn as a shaft of light draws the child upward, an immense dragon coiled in shadow before her, faint stars above — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s23 · 687.3–714.5 · A sign with three addresses
- section: The Census and Its Ransom
- image: assets-video/11-the-coin/scene-23.png
- beat: Every firstborn thereafter shalt thou redeem; Exodus 13:9 quote card — a sign on the hand, a memorial between the eyes, the LORD's law in thy mouth.
- prompt: A man at first light standing in an open doorway with a prayer shawl over his shoulders, lifting his open hand toward the dawn, a small seal-like mark of fine strokes on the back of the hand and a matching faint mark on his forehead, no straps or boxes — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s24 · 714.5–739.6 · The number of their names
- section: The Census and Its Ransom
- image: assets-video/11-the-coin/scene-24.png
- beat: The redemption count was a census of names — 22,273 exact to the man; the overage ransomed at five shekels a head; the price attaches to the name counted.
- prompt: Scribes at a long table unrolling a census scroll ruled with columns of fine strokes only, one stylus pausing at a single entry while elders wait in a queue beyond the lamplight — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s25 · 739.6–777.6 · The confession in the mouth
- section: The Census and Its Ransom
- image: assets-video/11-the-coin/scene-25.png
- beat: The fish gives up its riddle — the sign's third address is the mouth; Moses: the word is nigh, in thy mouth; Paul: confess with thy mouth; on a fish, forehead and mouth are the same place.
- prompt: A kneeling man in lamplight speaking with head lifted, the light catching his lips, an open scroll before him and shadow deep behind — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s26 · 777.6–805.8 · One stater, for me and thee
- section: The Census and Its Ransom
- image: assets-video/11-the-coin/scene-26.png
- beat: The coin is exact — a stater, one full shekel, precisely two half-shekel ransoms; be'ad us, the preposition of the atonement — one pays, another is covered.
- prompt: A weathered fisherman's hand pressing one broad silver stater into a collector's open palm by the shore, a second figure watching from behind, moored boats and quiet water beyond — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s27 · 805.8–834.5 · God counts first
- section: The Mark of the Beast
- image: assets-video/11-the-coin/scene-27.png
- beat: Section title; two enrollments set side by side; Revelation 7:4 quote card — the number of the sealed.
- prompt: Ranked companies standing tribe by tribe on a wide plain while a radiant messenger moves along the ranks pressing a seal to each forehead; red accent: the fresh seal-mark on the nearest brow, the only color in the frame — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s28 · 834.5–866.1 · A census of firstborn
- section: The Mark of the Beast
- image: assets-video/11-the-coin/scene-28.png
- beat: A census tribe by tribe like Sinai's; 144 alaphim / alluphim — chiefs, firsts; the sealed named the firstfruits — God's last census, like His first, a census of firstborn.
- prompt: A priest lifting a bound sheaf of first-ripe barley high before ranked companies standing tribe by tribe on a wide plain, morning light across the standards — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s29 · 866.1–890.6 · The beast counts
- section: The Mark of the Beast
- image: assets-video/11-the-coin/scene-29.png
- beat: Then the beast counts; Revelation 13:16-18 quote card — the mark, the name, the number; no man might buy or sell.
- prompt: A dark marketplace queue where each buyer stretches out a right hand to a seated official striking it with a coiner's die, scales and wares crowding the tables; red accent: the fresh struck mark on the foremost hand, the only color in the frame — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s30 · 890.6–914.9 · The counterfeit census
- section: The Mark of the Beast
- image: assets-video/11-the-coin/scene-30.png
- beat: The counterfeit member for member — its name where the Name goes, its number answering the number of the sealed; coin-mark for the market against ransom-coin for the sanctuary.
- prompt: A coiner's iron die and a ring-seal of authority set facing each other on a dark table, struck coins scattered on one side and pressed wax on the other, low lamplight between — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s31 · 914.9–942.2 · Minted men
- section: The Mark of the Beast
- image: assets-video/11-the-coin/scene-31.png
- beat: Charagma is mint vocabulary — an impression struck, the die-strike, graven by art and man's device; the man who takes the mark is minted — the census coin, paid in persons.
- prompt: Rows of freshly struck coins all bearing the same stamped profile, tongs setting the newest coin still bright from the strike at the front, the dark mint receding behind — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s32 · 942.2–979.8 · The registers face each other
- section: The Mark of the Beast
- image: assets-video/11-the-coin/scene-32.png
- beat: The equality clause kept — rich and poor; the beast's rolls against the book of life of the Lamb; "The LORD shall count, when he writeth up the people."
- prompt: Two great books open face to face across one table, one fair and radiant-paged, one dark under iron clasps, a single quill lying in the band of light between them, all writing suggested by faint strokes only — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s33 · 979.8–1002.4 · No plague among the counted
- section: The Mark of the Beast
- image: assets-video/11-the-coin/scene-33.png
- beat: The plague-clause inverts — the trumpets torment only the unsealed; the first vial falls on the marked; God's counted take no plague.
- prompt: A darkened street under descending plague-haze, every doorway swallowed in gloom except one lamplit marked door standing in clear air; red accent: the small seal-mark on that lintel, the only color in the frame — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s34 · 1002.4–1016.7 · Without money and without price
- section: The Mark of the Beast
- image: assets-video/11-the-coin/scene-34.png
- beat: Babylon's market cannot starve the sealed — Isaiah 55:1 quote card; the other market never closed.
- prompt: An open stall beside flowing waters where a robed seller hands bread and a brimming cup freely to ragged comers with empty upturned palms — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s35 · 1016.7–1065.2 · Let us make us a name
- section: The Mark of the Beast
- image: assets-video/11-the-coin/scene-35.png
- beat: Older than Rome — the founding charter on the plain of Shinar; Genesis 11:4 quote card; a name of man's own minting; none other name whereby we must be saved; two names, two censuses, two coinages.
- prompt: The tower of Babel rising in unfinished tiers from the plain of Shinar, long lines of builders hauling brick up its ramps beneath a heavy sky — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s36 · 1065.2–1095.7 · The number of one man
- section: The Number of One Man
- image: assets-video/11-the-coin/scene-36.png
- beat: Section title; count the number of the beast — the number of a man, adam echad; not first a gematria problem but a covenant census problem.
- prompt: A magistrate's table ranked with counting-pebbles in rows beside an open census scroll of faint strokes, a hand dropping one pebble into a bronze urn, onlookers shadowed beyond — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s37 · 1095.7–1135.0 · The white stone and the tally
- section: The Number of One Man
- image: assets-video/11-the-coin/scene-37.png
- beat: The words vote that way — psephizo, tallying with a psephos; "counteth the cost"; "I will give him a white stone… a new name written" — not lithos but psephos, the counting-pebble.
- prompt: An open palm receiving a single smooth white counting-pebble above a table strewn with tally-pebbles and an opened census scroll, lamplight on the stone — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s38 · 1135.0–1167.4 · The vote for and the vote against
- section: The Number of One Man
- image: assets-video/11-the-coin/scene-38.png
- beat: A psephos is a vote and an enrollment-token — Paul's voice against the saints, Matthias numbered with the eleven; the good testimony with the new name is God's vote cast FOR a man; the mark is the vote against.
- prompt: A stern council chamber where a robed accuser's hand releases a dark pebble into a bronze urn, bound believers standing small in the torchlit background — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s39 · 1167.4–1183.8 · The ledger reckoning
- section: The Number of One Man
- image: assets-video/11-the-coin/scene-39.png
- beat: The Hebrew's counting verb — chashav, the ledger-reckoning of "counted it to him for righteousness" and of the redemption-price arithmetic; you shall find the sum.
- prompt: An aged bookkeeper by lamplight setting a stylus stroke in a great open ledger of faint ruled columns, coin-weights and a small balance at his elbow — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s40 · 1183.8–1211.6 · 666 talents in one year
- section: The Number of One Man
- image: assets-video/11-the-coin/scene-40.png
- beat: The number as money — 1 Kings 10:14 quote card; the revenue lands where the king began multiplying gold against the law of the king.
- prompt: Servants heaping weighed stacks of gold talents before a high ivory throne, the enthroned king distant and shadowed above the shining tribute — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s41 · 1211.6–1245.8 · The children of Adonikam, 666
- section: The Number of One Man
- image: assets-video/11-the-coin/scene-41.png
- beat: The number as census — Ezra 2:13 quote card; a count filed under the name that owns it, in the register of those coming out of Babylon; Revelation keeps both ledgers in that grammar.
- prompt: A caravan of families streaming out of a great city gate at dawn while a roadside scribe marks a tally scroll of faint strokes as they pass — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s42 · 1245.8–1286.5 · Few there be that find it
- section: The Number of One Man
- image: assets-video/11-the-coin/scene-42.png
- beat: Count the number asks for arithmetic — the Remnant's count settles near 2 in 1,000 beside 1 in 666; few there be that find it; every man ends in one census or the other.
- prompt: A broad crowded highway streaming toward a wide dark gate under haze, while two or three small figures climb a narrow stone path apart toward high light — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.

### s43 · 1286.5–1313.6 · Fifteen pieces of silver
- section: Closing — handoff to Marriage and Divorce
- image: assets-video/11-the-coin/scene-43.png
- beat: Hosea acts the ransomed side out — "So I bought her to me for fifteen pieces of silver"; the Husband paying coin to redeem the wife who left him; the marriage itself is the next chapter.
- prompt: Hosea in a shadowed market counting fifteen pieces of silver into a trader's hand while a downcast woman stands beside him, his other hand reaching gently for hers — monochrome-sepia photographic-painterly, lighter exposure, warm tone, 16:9.
