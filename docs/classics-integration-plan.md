# Classics (Philo & Josephus) — Full Integration Plan

Integrate Philo and Josephus into the app as another “book” in the Reader: discoverable from the landing page, search, and book citations; with path-based URLs and full navigation.

---

## 1. URL scheme (path-based, consistent with existing reader)

**Philo**
- `/reader/philo` — Index: list of works (e.g. On the Creation, On the Migration of Abraham). Optional “author” landing.
- `/reader/philo/{work-slug}` — Work index: list sections or show first section (e.g. `/reader/philo/on-the-creation`).
- `/reader/philo/{work-slug}/{section}` — Section view (e.g. `/reader/philo/on-the-creation/42`).  
  `work-slug` = canonical work name lowercased, spaces → hyphens (e.g. `on-the-creation`).

**Josephus**
- `/reader/josephus` — Index: list of works (Antiquities, Jewish War, Against Apion, Life).
- `/reader/josephus/{work-slug}` — Work index: list books (e.g. Antiquities → books 1–20).
- `/reader/josephus/{work-slug}/{book}` — Book index: list chapters or first chapter.
- `/reader/josephus/{work-slug}/{book}/{chapter}/{section}` — Section view (e.g. `/reader/josephus/antiquities/18/2/2`).  
  `work-slug` = `antiquities`, `jewish-war`, `against-apion`, `life`.

**State params**
- Philo: `contentType: 'philo'`, `work: string` (display name or slug), `section: string` (e.g. `"42"`, `"1.1"`).
- Josephus: `contentType: 'josephus'`, `work: string`, `book: number`, `chapter: number`, `section: number`.

---

## 2. Pages and discoverability (where Classics must appear)

| Page / surface | What to do |
|----------------|------------|
| **Reader landing** (`/reader` with no path) | Add one card: “Classics (Philo & Josephus)” — “Primary sources: Philo of Alexandria and Josephus. Read by work and section, same citation style as in the book.” → `SET_VIEW reader, params: { contentType: 'philo' }` (or a combined classics index; see 3.1). |
| **Reader content-type dropdown** (bible-view.js) | Add option(s): “Classics” or “Philo” and “Josephus”. When selected → `SET_VIEW reader, params: { contentType: 'philo' }` or `contentType: 'josephus'`. |
| **Reader view switch** (reader-view.js) | Add cases `contentType === 'philo'` and `contentType === 'josephus'`: render classics index or section (see 3.2). |
| **URL router** (url-router.js) | **Parse:** `/reader/philo`, `/reader/philo/on-the-creation`, `/reader/philo/on-the-creation/42`; `/reader/josephus`, `/reader/josephus/antiquities/18/2/2`. **Build:** from state.params build the same path segments. |
| **Global search** (global-search.js) | After Bible citation check: if `Classics.parseCitation(query)` returns a result, navigate to reader with the appropriate `contentType`, work, section (and book/chapter/section for Josephus). |
| **Time Tested / book chapters** (reader-view.js) | After `linkifyScriptureRefs` and `linkifySymbolRefs`, call **linkifyClassicsRefs(container)** to turn “Antiquities 18.2.2”, “Philo, On the Creation 42”, “Josephus, Against Apion 2.282” into links that dispatch to reader with classics params. |
| **Help view** (help-view.js) | In “Search” or “Navigation”: add a short “Classics (Philo & Josephus)” bullet — “You can jump to a passage by typing a citation (e.g. Antiquities 18.2.2 or On the Creation 42) in search, or by clicking citations in the book.” |
| **Sitemap** (sitemap.xml) | Add entry: `https://lunarsabbath.net/reader/philo` and `https://lunarsabbath.net/reader/josephus` (and optionally a few key section URLs). |

---

## 3. Implementation tasks (ordered)

### 3.1 Script load and data

- **index.html (or main app entry)**  
  - Ensure `classics.js` is loaded (same as `bible.js`).  
- **First use**  
  - When user navigates to any classics content (reader with `contentType === 'philo'` or `'josephus'`), call `Classics.loadAuthor('philo')` and/or `Classics.loadAuthor('josephus')` if not already loaded (lazy load).  
  - Optionally preload `philo` when the app loads (like Bible) for snappier search.

### 3.2 URL router

- **Parse (reader branch)**  
  - If `contentType === 'philo'`: `parts[1]` = work slug, `parts[2]` = section. Set `params.contentType = 'philo'`, `params.work` (from slug → display name if needed), `params.section`.  
  - If `contentType === 'josephus'`: `parts[1]` = work slug, `parts[2]` = book, `parts[3]` = chapter, `parts[4]` = section. Set `params.contentType = 'josephus'`, `params.work`, `params.book`, `params.chapter`, `params.section`.  
- **Build (_buildViewParams reader)**  
  - For `contentType === 'philo'`: path = `/philo` + (work ? `/${workSlug}` : '') + (section ? `/${section}` : '').  
  - For `contentType === 'josephus'`: path = `/josephus` + (work ? `/${workSlug}` : '') + (book ? `/${book}` : '') + (chapter != null ? `/${chapter}` : '') + (section != null ? `/${section}` : '').  
- **Slug ↔ display name**  
  - Philo: `On the Creation` ↔ `on-the-creation` (use `Classics.getWorks('philo')` and a small slugify when building URLs; when parsing, map slug back to the exact work name used in `Classics.getSection`).  
  - Josephus: `Antiquities` ↔ `antiquities`, `Jewish War` ↔ `jewish-war`, etc.

### 3.3 Reader landing page

- In **reader-view.js** `renderLandingPage`: add a **Classics** card in the grid (e.g. after Time Tested Tradition):
  - Icon, title “Classics (Philo & Josephus)”, one-line description, “Open Classics →”.
  - `onclick`: `AppStore.dispatch({ type: 'SET_VIEW', view: 'reader', params: { contentType: 'philo' } })` (opens Philo index; user can switch to Josephus via dropdown or a sub-nav).

### 3.4 Reader content selector (bible-view.js)

- In **contentTypeOptions** add: `{ value: 'philo', label: 'Philo' }` and `{ value: 'josephus', label: 'Josephus' }` (or a single “Classics” that goes to a combined index).
- When `contentType === 'philo'` or `'josephus'`: show a **classics selector** block (author or work dropdown, then work/section or book/chapter/section). Reuse the same show/hide pattern as bible/symbols/tt selectors (e.g. `classicsSelectors.style.display = ...`).
- **Populate work dropdown** from `Classics.getWorks('philo')` / `Classics.getWorks('josephus')`. On change, dispatch to reader with that work and no section (or first section).

### 3.5 ReaderView: render classics

- In **reader-view.js** `render`:
  - Add to the `currentKey` switch: `case 'philo': ...` and `case 'josephus': ...`.
  - Add to the main switch: `case 'philo': this.renderPhiloContent(...); break;` and `case 'josephus': this.renderJosephusContent(...); break;`.
- **renderPhiloContent(state, derived, container, params)**  
  - If no `params.work`: render **Philo index** (list of works from `Classics.getWorks('philo')`, each linking to `/reader/philo/{work-slug}`).  
  - If `params.work` and no `params.section`: render **work index** (list of sections for that work from index keys, or “first section” link). If the blob doesn’t expose section list, show first section and a simple nav or “Section: [input]”).  
  - If `params.work` and `params.section`: call `Classics.getSection('philo', work, section)`, render the section text (with basic formatting and a title like “On the Creation 42”). Provide prev/next or section jumper if feasible.
- **renderJosephusContent(state, derived, container, params)**  
  - If no `params.work`: render **Josephus index** (list of works).  
  - If work but no book: list books (1–20 for Antiquities, etc.).  
  - If book/chapter/section: call `Classics.getSection('josephus', ref)` with ref `Work|book|chapter|section`, render section text and nav (e.g. same book/chapter, adjacent section).
- After rendering section content, call **updateReaderContentSelector('philo')** or **updateReaderContentSelector('josephus')** in a setTimeout (same pattern as symbols/timetested).

### 3.6 Classics selectors in bible-view

- Add a block (e.g. `#classics-selectors`) with:
  - **Author** dropdown: Philo | Josephus (or two separate content types and only show one at a time).
  - **Work** dropdown: populated from `Classics.getWorks(authorId)`.
  - **Philo:** section input or dropdown (if you build a section list per work).
  - **Josephus:** book, chapter, section inputs or dropdowns.
- Changing any control dispatches `SET_VIEW` with reader and the new params so the URL and content update (single source of truth: state → URL, state → view).

### 3.7 Global search

- In **global-search.js** `search()`, after the Bible citation block and before date parsing:
  - If `typeof Classics !== 'undefined'`: `const parsed = Classics.parseCitation(query)`; if `parsed`, then `navigateToClassics(parsed)` (e.g. set view to reader, params from parsed: contentType = parsed.author, work, section or book/chapter/section). Then `return`.
- **navigateToClassics(parsed)** builds `params` from `parsed` and dispatches `SET_VIEW` to reader.

### 3.8 Book chapter citation links (Philo & Josephus)

- **reader-view.js**: add **linkifyClassicsRefs(container)**.
  - Walk text nodes (or use a regex over innerHTML with care to avoid breaking tags). Match patterns such as:
    - “Antiquities 18.2.2”, “Ant. 18.2.2”, “Josephus, Antiquities of the Jews 17.2.4”.
    - “On the Creation 42”, “Philo, On the Creation 42”, “Special Laws II, XXX”, “Against Apion 2.282”.
  - For each match, call `Classics.parseCitation(match)` (or parse Philo/Josephus separately). If parsed, wrap in `<a href="..." data-classics-citation="..." data-classics-author="..." ...>`. `href` = reader URL built from parsed (e.g. `/reader/philo/on-the-creation/42` or `/reader/josephus/antiquities/18/2/2`).
- **Click handler**: either `onclick` on the link that calls `event.preventDefault()` and `AppStore.dispatch({ type: 'SET_VIEW', view: 'reader', params: { ... } })`, or delegate on the container for `[data-classics-citation]`.
- Call **linkifyClassicsRefs** wherever Time Tested (and other reader) content is rendered after `linkifyScriptureRefs` / `linkifySymbolRefs`: e.g. in `renderTimeTestedInBibleFrame` after setting content and calling those two.

### 3.9 Help view

- In the Search or Navigation section, add one short subsection: “Classics (Philo & Josephus)”. Text: you can go to a passage by typing a citation in the search box (e.g. “Antiquities 18.2.2” or “On the Creation 42”) or by clicking Philo/Josephus citations in the book chapters.

### 3.10 Sitemap

- Add:
  - `https://lunarsabbath.net/reader/philo`
  - `https://lunarsabbath.net/reader/josephus`  
  Optional: a few high-value section URLs (e.g. reader/philo/on-the-creation/1, reader/josephus/antiquities/18/2/2).

### 3.11 Copy-friendly links and titles

- When rendering a classics section, set **document title** (or a visible heading) to the canonical citation (e.g. “Antiquities 18.2.2” or “On the Creation 42”) so that when users copy the URL, the tab title reflects the passage. Optionally add a “Copy link” button that copies the current reader URL (path) to the clipboard.

---

## 4. File checklist

| File | Changes |
|------|--------|
| **index.html** (or main entry) | Add script tag for `classics.js`. |
| **url-router.js** | Parse `/reader/philo/...` and `/reader/josephus/...`; in `_buildViewParams` for reader, build path for philo and josephus. |
| **views/reader-view.js** | Landing card; switch cases for philo/josephus; renderPhiloContent, renderJosephusContent; linkifyClassicsRefs; call linkifyClassicsRefs after linkifyScriptureRefs in Time Tested (and any other reader content that shows book text). |
| **views/bible-view.js** | Content type options “Philo” and “Josephus”; classics selector block and visibility; populate work (and section/book/chapter/section) dropdowns; on change dispatch reader with new params. |
| **global-search.js** | After Bible, if Classics.parseCitation(query) returns truthy, navigate to reader with classics params; add navigateToClassics(parsed). |
| **views/help-view.js** | One subsection for Classics search/navigation. |
| **sitemap.xml** | Add /reader/philo and /reader/josephus. |
| **assets/css/reader.css** (or components.css) | Styles for classics index, section panel, and classics selector (if needed). |

---

## 5. Edge cases and notes

- **Slug stability:** Use a single slugify rule (e.g. work name toLowerCase, replace spaces with `-`, remove non-alphanumeric) and when parsing URL slug, match against `Classics.getWorks()` by comparing slugified names so “On the Creation” and “on-the-creation” round-trip.
- **Missing section:** If user opens `/reader/philo/on-the-creation/99999` and that section doesn’t exist, show a friendly “Section not found” and a link back to the work index.
- **Back/forward:** URL is the source of truth; router already syncs state from URL on popstate, so back/forward will work once parse/build are implemented.
- **No new view name:** Classics live under the existing **reader** view with `contentType: 'philo'` and `contentType: 'josephus'`; no new top-level view or route.

---

## 6. Summary

- **URLs:** Path-based `/reader/philo/...` and `/reader/josephus/...` (see §1).  
- **Surfaces:** Reader landing card, reader content dropdown, reader switch + classics index/section rendering, URL parse/build, global search, Time Tested (and similar) linkification, help, sitemap.  
- **Data:** Already in place (`classics.js`, `Classics.loadAuthor`, `getSection`, `parseCitation`); integration is wiring state, URL, and UI to these APIs and adding discoverability on every page where it makes sense.
