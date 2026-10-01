# Using the TimeTested.Bible Repository With Your Own AI

This repository is the source of <https://timetested.bible>. Besides the website, it carries a complete set of plain-text Bibles with Strong's numbers, the Hebrew and Greek source texts, lexicons, interlinears, the Hebrew Gospels, and the author's symbol dictionary and book manuscripts. Any AI assistant that can read files and run shell commands (Claude Code, Cursor, Codex, Aider, and similar) can use it as a verified research library: you ask the question, the assistant greps the texts and quotes what is actually there instead of what it remembers.

This guide covers getting the repository, pointing an assistant at it, the research conventions that keep the answers honest, and the file formats.

## 1. What is in the repository for research

### Bible texts (`bibles/`)

Every file is one verse per line, tab-separated: `Book Chapter:Verse<TAB>text`. Line 1 is a short code, line 2 a description. The `.txt` files are tracked uncompressed; the `.txt.gz` copies beside them are for the web app and can be ignored.

| File | Text | Notes |
|---|---|---|
| `kjv_strongs.txt` | King James Version | Strong's tags inline as `{H7225}` / `{G3056}`; verb forms as `{(H8804)}` |
| `akjv_strongs.txt` | American King James | Strong's tags |
| `asv_strongs.txt` | American Standard Version 1901 | Strong's tags |
| `ylt.txt` | Young's Literal Translation | most literal English |
| `dbt.txt` | Darby | |
| `slt.txt` | Smith's Literal Translation | |
| `wbt.txt` | Webster | |
| `drb.txt` | Douay-Rheims | |
| `jps.txt` | JPS 1917 Tanakh (OT) / Weymouth (NT) | |
| `wlc.txt` | Westminster Leningrad Codex | Hebrew OT, pointed |
| `lxx_greek.txt` | Septuagint, Swete's Greek text | LXX versification (see §4) |
| `lxx.txt` | Septuagint, Brenton's English | |
| `greek_nt.txt` | Greek New Testament | Alexandrian-type text (see §4) |
| `hg.txt` | Hebrew Gospels, English translation with Strong's tags | Matthew, Mark, Luke, John, James, Jude, Revelation from Hebrew manuscripts |

### Lexicons and dictionaries

- `strongs-hebrew-dictionary.js`, `strongs-greek-dictionary.js`: Strong's concise dictionaries (Open Scriptures, CC-BY-SA), as JavaScript objects keyed `H1234` / `G1234`.
- `data/bdb.json`: Brown-Driver-Briggs Hebrew lexicon keyed by Strong's number.
- `data/tipnr.json`: proper names with references.
- `data/dictionaries/webster-1913/`: Webster 1913 for period English (what a KJV word meant).
- `word-study-dictionary.js`: the author's word studies keyed by Strong's number.
- `symbol-dictionary.js` and `_symbols/*.md`: the author's symbol dictionary (269 entries), each symbol defined from Scripture's own cross-text usage.

### Interlinears and morphology

- `data/interlinear.json`: Hebrew OT word by word, keyed `"Genesis 1:1"`, each word with Strong's number and gloss.
- `data/nt-interlinear.json`: Greek NT word by word with lemma.
- `data/morphhb.json`: Open Scriptures Hebrew Bible morphology.
- `data/hebrew-gospels-interlinear.json`: the Hebrew Gospels word by word, `[hebrew, strongs, gloss]` per word.
- `data/hg-chapters/*.json`: one file per Hebrew Gospel chapter with translation, source, and translator notes (117 chapters).
- `data/hebrew-gospels-notes.json`: per-chapter summaries of where the Hebrew differs from the Greek.

### Author's rulings and reference data

- `data/translation-patches.json`: verses where the site displays a reading that differs from the KJV, with the reasoning. Check it before quoting a verse the author has ruled on.
- `cross_references.txt`: cross references with vote counts (openbible.info, CC-BY), references in `Gen.1.1` form.
- `books/symbolic-language/`, `books/time-tested-tradition/`: the book manuscripts (AsciiDoc).
- `research/`: working notes and calculations behind blog posts and chapters.
- `docs/`: design and planning documents.

## 2. Getting the repository

The full history is about 2.5 GB to download and 1.3 GB on disk. Three options, from largest to smallest:

```bash
# A. Full clone
git clone https://github.com/timetestedbible/timetestedbible.github.io.git

# B. Shallow clone (current files only, no history)
git clone --depth 1 https://github.com/timetestedbible/timetestedbible.github.io.git

# C. Research-only sparse checkout (about 250 MB)
git clone --filter=blob:none --sparse https://github.com/timetestedbible/timetestedbible.github.io.git
cd timetestedbible.github.io
git sparse-checkout set bibles data _symbols books research docs
```

Option C fetches the Bible texts, data files, symbol dictionary, books, and research notes. Top-level files (the Strong's dictionaries, `cross_references.txt`, this guide) are always included in a sparse checkout. You can add directories later with `git sparse-checkout add <dir>`.

No build step is needed for research. Everything is plain text or JSON. The only tools the assistant needs are `grep`, `sed`, and `python3`.

To pick up updates:

```bash
git pull
```

## 3. Pointing an AI assistant at the repository

### Claude Code

```bash
cd timetestedbible.github.io
claude
```

Then ask your question in plain language. Claude Code will grep the files and quote them. Put the conventions block from §4 into a file named `CLAUDE.md` at the repository root so every session starts with the same rules.

### Cursor, Windsurf, VS Code agents, Codex CLI, Aider

Open the folder as the workspace and use the agent chat. Save the §4 conventions as `AGENTS.md` (Codex, Aider) or in the tool's rules file (Cursor: `.cursor/rules`). The commands in §5 work in any of them.

### Web chat without file access (ChatGPT, Claude.ai)

Run the commands in §5 yourself and paste the output lines into the chat. The point is the same: the model reasons over the verified text, not over its memory of it.

## 4. Research conventions (paste into `CLAUDE.md` or `AGENTS.md`)

```markdown
# Research conventions for this repository

1. Quote the King James Version by default from bibles/kjv_strongs.txt with the
   Strong's tags stripped. When the KJV flattens a key word, quote the most
   literal rendering (ylt.txt, dbt.txt, asv_strongs.txt, slt.txt) and say so.

2. Never assert a Hebrew or Greek word from memory. Grep the Strong's tag in
   kjv_strongs.txt and tally how the KJV renders it before claiming "same word."

3. For every key verse, show the Hebrew (wlc.txt), the Septuagint
   (lxx_greek.txt), and the Greek New Testament (greek_nt.txt) as relevant.

4. For New Testament wording, check the Hebrew Gospels (hg.txt and
   data/hebrew-gospels-interlinear.json) as a second witness and note
   differences from the Greek.

5. Check data/translation-patches.json before quoting a verse; the author has
   ruled on some readings.

6. Versification differs between texts. LXX Psalms run one number lower than
   the Hebrew and English (English Ps 23 = LXX Ps 22). LXX Jeremiah is
   reordered (English Jer 50 = LXX Jer 27). The Hebrew verse number is often
   one higher than the English where a psalm has a title or a verse is split
   (English Ps 89:14 = WLC 89:15; Hos 2:19 = WLC 2:21; Jer 9:24 = WLC 9:23;
   Zech 2:12 = WLC 2:16; Ex 22:21 = WLC 22:20; Mal 4:1 = WLC 3:19; Joel 3 =
   WLC 4). If a grep returns the wrong verse, check the offset.

7. greek_nt.txt is an Alexandrian-type text. Phrases in the KJV that rest on
   Byzantine readings will be absent (for example "and keep the law" in Acts
   15:24 and "that they observe no such thing" in Acts 21:25). Say which text
   a phrase comes from before arguing from it.

8. English words are not evidence. The KJV renders goy as "nations,"
   "heathen," and "Gentiles," and renders four Hebrew words (ger, nokhri, zar,
   toshav) as "stranger." Find the Hebrew or Greek behind the English first.

9. The consonantal Hebrew is older than the vowel points. A reading the
   consonants permit may be offered as a second dimension, flagged as such.

10. Before concluding, sweep for counter-texts. Quote verses whole and in
    context. Transliterate Hebrew and Greek rather than printing the script.

11. Define words from Scripture's own cross-text usage, not from later
    theology. Give the verses, then the conclusion.
```

## 5. Query recipes

These are the commands an assistant will run. Run from the repository root.

Pull verses from the KJV with tags stripped:

```bash
grep "^Genesis 22:17	\|^Isaiah 54:3	" bibles/kjv_strongs.txt | sed 's/{[^}]*}//g'
```

Pull the same verses with Strong's tags kept:

```bash
grep "^Isaiah 54:3	" bibles/kjv_strongs.txt
```

Hebrew, Septuagint, and Greek New Testament text:

```bash
grep "^Isaiah 54:3	" bibles/wlc.txt
grep "^Isaiah 54:3	" bibles/lxx_greek.txt
grep "^Romans 2:25	" bibles/greek_nt.txt
```

Every verse containing a Strong's number, and the count:

```bash
grep "{H1471}" bibles/kjv_strongs.txt | sed 's/{[^}]*}//g'
grep -c "{H1471}" bibles/kjv_strongs.txt
```

Tally how the KJV renders a Strong's number:

```bash
python3 - <<'EOF'
import re, collections
H = 'H1471'                      # goy, "nation"
c = collections.Counter()
for line in open('bibles/kjv_strongs.txt', encoding='utf-8'):
    ref, _, txt = line.partition('\t')
    for m in re.finditer(r'((?:[A-Za-z\'-]+\s?){1,2})\{' + H + r'\}', txt):
        c[m.group(1).strip().lower().split()[-1]] += 1
for word, n in c.most_common():
    print(n, word)
EOF
```

Other English versions:

```bash
grep "^Romans 2:25	" bibles/ylt.txt bibles/dbt.txt bibles/asv_strongs.txt
```

Hebrew Gospels, English with tags:

```bash
grep "^Matthew 5:19	" bibles/hg.txt
```

Hebrew Gospels, word by word (the book value is a list; index it by chapter number and check the index rather than assuming it starts at zero):

```bash
python3 - <<'EOF'
import json
d = json.load(open('data/hebrew-gospels-interlinear.json'))
ch = d['Matthew'][5]              # chapter 5
for w in ch['19']:                # verse 19 -> list of [hebrew, strongs, gloss]
    print(w[0], w[1], w[2])
EOF
```

Brown-Driver-Briggs entry:

```bash
python3 -c "import json; print(json.load(open('data/bdb.json'))['H1616'][:1500])"
```

Strong's dictionary entry (the .js files are a JavaScript object; the simplest route is grep):

```bash
grep -A6 '"H1616"' strongs-hebrew-dictionary.js
```

Cross references for a verse:

```bash
grep "^Isa.54.3	" cross_references.txt | sort -t$'\t' -k3 -nr | head
```

The author's symbol entry for a word:

```bash
cat _symbols/sheep.md 2>/dev/null || ls _symbols | grep -i sheep
```

Translation patches:

```bash
python3 -c "import json; [print(p['verse'], '-', p['summary'][:120]) for p in json.load(open('data/translation-patches.json'))['patches']]"
```

## 6. Example questions

These are the kinds of questions the library answers well:

- Quote Romans 2:25 and show the Greek words behind "keep" and "breaker." How does the Septuagint use those words for Hebrew terms?
- Which Hebrew word is behind "lot" in Deuteronomy 32:9, and how else does the KJV render it?
- Is "stranger" in Leviticus 19:34 the same word as "Gentile"? Show the Hebrew and the Septuagint.
- Compare Matthew 5:19 in the Greek and the Hebrew Matthew word by word.
- Every verse where Israel is called "firstborn" or "firstfruits," with the Hebrew.
- Where does Scripture call betrothed people husband and wife before the wedding?
- Tally how the KJV renders *chevel* (H2256) and group the senses.
- What does Ecclesiastes set beside *hevel* that shows what the word means?
- Which verses are used to argue the law is done away, and where does the English carry the argument rather than the Greek?

Ask for the verse, the original-language word, the Septuagint rendering, the Hebrew Gospels reading, and the KJV tally, and the assistant will have everything it needs in the repository.

## 7. Optional: run the website locally

Not needed for research. If you want the calendar, reader, and study tools running on your machine:

```bash
bundle install
bundle exec jekyll serve --host 127.0.0.1 --port 4000
```

Then open <http://127.0.0.1:4000>. Ruby and Bundler are required. The calendar engine tests live in `_dev/tests` (`npm install && npm test`).

## 8. Licenses and sources

The KJV, American KJV, ASV, Young's, Darby, Smith's, Webster, Douay-Rheims, JPS 1917, Weymouth, Brenton's Septuagint, and the Westminster Leningrad Codex are public domain. Swete's Septuagint text is public domain; its digitization is GPL-3.0 (see the file header). The Strong's dictionaries are CC-BY-SA (Open Scriptures). The cross references are CC-BY (openbible.info). The Hebrew Gospels translations cite their manuscript sources in `data/hg-chapters/*.json`. The book manuscripts under `books/` are the author's. For the site's policies on quoting modern translations see `books/copyright-policies/`.
