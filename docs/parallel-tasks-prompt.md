# Parallel Agent Task List

These are self-contained tasks from `docs/DEFERRED-TASKS.md` that can be completed independently without user input. Each task has clear inputs, expected output, and verification steps.

After completing each task, mark it as done in `docs/DEFERRED-TASKS.md` with `[x]`.

---

## Task 1: Custom Anchor Support in Markdown Headings

**Problem:** Study markdown files use `{#anchor-name}` syntax in headings (e.g., `## Title {#context}`). The `marked.js` renderer does not handle this — it renders `{#context}` as visible text in the heading.

**Fix:** In `views/reader-view.js`, find the `renderMarkdown()` method (around line 955). After the line `let html = marked.parse(text);` (around line 970), add this post-processing step:

```javascript
// Support {#anchor-name} syntax in headings — strip from display, use as id
html = html.replace(/<(h[1-6])([^>]*)>(.*?)\s*\{#([\w-]+)\}\s*<\/(h[1-6])>/g, '<$1$2 id="$4">$3</$5>');
```

**Verify:** Open `/reader/verse-studies/DANIEL-9` in the browser. Headings like "The Context: Daniel's Perplexity" should NOT show `{#context}` as visible text. Inspect the HTML — the heading should have `id="context"`.

---

## Task 2: Study Article Link Styling

**Problem:** Internal links inside study articles (e.g., links to symbol studies, verse studies) appear as dark blue text barely distinguishable from body text. They need visible styling.

**Fix:** In `assets/css/reader.css` (or `assets/css/bible-styles.css` — whichever has `.word-study-body` styles), add:

```css
.word-study-body a,
.symbol-study-body a,
.symbol-article-body a,
.number-study-body a {
  color: var(--accent-color, #4a90d9);
  text-decoration: underline;
  text-decoration-color: rgba(74, 144, 217, 0.4);
  text-underline-offset: 2px;
}

.word-study-body a:hover,
.symbol-study-body a:hover,
.symbol-article-body a:hover,
.number-study-body a:hover {
  text-decoration-color: currentColor;
}
```

If `--accent-color` is not defined, pick a color that works in both light and dark modes by checking existing link colors in the CSS.

**Important:** This must cover BOTH static markdown links AND dynamically injected scripture reference links (from `linkifyScriptureRefs`). Both produce `<a>` tags inside the content containers. The styling must make links clearly distinct from bold text and from symbol-highlighted words.

**Verify:** Open `/reader/verse-studies/H369` — links like "JERUSALEM Symbol Study" AND scripture references like "Genesis 5:24" should both be visibly underlined and colored, clearly distinct from surrounding bold body text. Check both light and dark mode.

---

## Task 3: Add GRASS and JERUSALEM to Symbol Dictionary

**Problem:** The GRASS and JERUSALEM symbol studies are written (`symbols/GRASS.md`, `symbols/JERUSALEM.md`) but they are not in `symbol-dictionary.js`, so they don't appear in the symbol grid and don't get word-matched in Bible text.

**Fix:** In `symbol-dictionary.js`, add entries following the existing pattern. Find the alphabetical position and add:

```javascript
'grass': {
  name: 'GRASS',
  words: ['grass', 'grasses'],
  strongs: ['H2682'],
  is: 'People',
  is2: 'Mortal People',
  does: 'Flourishes briefly, withers',
  does2: 'Subject to the wind/Spirit',
  sentence: 'Human beings in their transience and mortality — flesh that flourishes briefly and then is gone, subject to the wind/Spirit of God',
  opposite: 'Word of God (eternal)',
  link: '/symbols/grass/'
},

'jerusalem': {
  name: 'JERUSALEM',
  words: ['jerusalem', 'zion'],
  strongs: ['H3389', 'H6726'],
  is: 'Bride',
  is2: 'Covenant Community',
  does: 'Gathers God\'s people',
  does2: 'Dwells with God',
  sentence: 'The gathered people of God — those in covenant relationship with Him, dwelling together under His rule and in His presence',
  opposite: 'Babylon',
  link: '/symbols/jerusalem/'
},
```

**Verify:** Open `/reader/symbols` — GRASS and JERUSALEM should appear in the symbol grid. Open a Bible chapter containing "grass" (e.g., Isaiah 40) — the word should be highlighted as a symbol word.

---

## Task 4: Delete Old DANIEL-9-26.md

**Problem:** `words/DANIEL-9-26.md` is superseded by `words/DANIEL-9.md`. The old file should be removed.

**Fix:**
1. Delete `words/DANIEL-9-26.md`
2. Search all `.md` and `.js` files for references to `DANIEL-9-26` and update them to `DANIEL-9`:
   - Check `views/reader-view.js` for any hardcoded references
   - Check `words/H369.md` for cross-reference links
   - Check `symbols/GRASS.md` for cross-reference links

**Verify:** No broken links. `/reader/verse-studies/DANIEL-9` loads correctly. `/reader/verse-studies/DANIEL-9-26` should 404 gracefully.

---

## Task 5: Service Worker Cache Updates

**Problem:** New study files need to be added to the service worker's cache list for offline access.

**Fix:** In `sw.js`, find the `SYMBOL_ASSETS` array (or equivalent cache list for study content). Add:

```javascript
'/words/DANIEL-9.md',
'/words/H369.md',
'/symbols/GRASS.md',
'/symbols/JERUSALEM.md',
```

Also check if the `/reader/verse-studies/` route needs any special handling for offline navigation (the SPA shell should handle it, but verify).

**Verify:** Open the app, navigate to a verse study, then go offline (DevTools > Network > Offline). The study should still load from cache.

---

## Task 6: Scripture Reference Parser — Comma Support + Tests

**Problem:** `linkifyScriptureRefs` in `views/reader-view.js` (line 1028) does not handle comma-separated verses like `Deuteronomy 16:9,10,16`.

**Fix:** Replace the regex pattern on line 1028:

Current:
```javascript
const pattern = new RegExp(`\\b(${books})\\s+(\\d+)(?::(\\d+)(?:[-–—](\\d+))?)?\\b`, 'g');
```

New (handles comma-separated verses):
```javascript
const pattern = new RegExp(`\\b(${books})\\s+(\\d+)(?::(\\d+(?:[-–—]\\d+)?(?:,\\s*\\d+(?:[-–—]\\d+)?)*))?\\b`, 'g');
```

Also update the replacement logic to handle the comma-separated verse string — generate a multiverse link when commas are present (e.g., `/reader/multiverse/kjv/Deut.16.9.10.16`).

**Unit Tests:** Create `tests/test-linkify-scripture.js` with test cases:

```javascript
const testCases = [
  { input: 'Genesis 1:1', expected: 'matched', desc: 'Simple verse' },
  { input: 'Romans 11:17-24', expected: 'matched', desc: 'Verse range' },
  { input: 'Matthew 13', expected: 'matched', desc: 'Chapter only' },
  { input: 'Deuteronomy 16:9,10,16', expected: 'matched', desc: 'Comma-separated' },
  { input: 'Daniel 9:24-27', expected: 'matched', desc: 'Range notation' },
  { input: 'Psalm 37:10', expected: 'matched', desc: 'Psalm singular' },
  { input: 'Psalms 37:10', expected: 'matched', desc: 'Psalms plural' },
  { input: '1 Thessalonians 4:17', expected: 'matched', desc: 'Book with number' },
  { input: 'Isaiah 60:10,11,12', expected: 'matched', desc: 'Isaiah comma list' },
];
```

**Verify:** Run the test file. Open `/reader/verse-studies/DANIEL-9` — all scripture references in the study should be clickable links.

---

## General Notes

- Follow the architecture rules in `.cursor/rules/architecture.mdc` — all UI derives from state, dispatch actions, no imperative DOM manipulation.
- Follow the git workflow in `.cursor/rules/git-workflow.mdc` — do NOT commit or push unless explicitly asked. Bump `APP_VERSION` in `version.js` if committing.
- Test changes by running `python3 serve.py` and opening `localhost:8000` in a browser.
