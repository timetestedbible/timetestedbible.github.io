# Translation Patch System — Design Document

## Overview

A unified system for **highlighting, annotating, and optionally replacing** translation choices across all supported Bible translations. Ranges from lightweight word swaps ("new moon" → "renewed moon") to deep verse studies with full alternative readings (Daniel 9:24-27).

The system uses a visual language of **orange** (caution — question about this translation) and **blue** (study reading active) to guide users through discovery, evaluation, and optional adoption of alternative readings.

---

## Patch Types

| Type | Example | Targeting | Default | Volume |
|------|---------|-----------|---------|--------|
| **Strong's swap** | "new moon" → "renewed moon 🌕" (H2320) | By Strong's number — applies everywhere | On or Off | ~10-20 rules, hundreds of verses |
| **Phrase patch** | "be cut off" → "cut [a covenant]" in Dan 9:26 | By verse + phrase, per translation | Typically Off | ~6-12 studies, dozens of phrases |
| **Presentation** | Add emoji indicators | Visual only, no text change | On | Light |

---

## Data Model

### Patch Registry

A single JSON file defines all patches: `data/translation-patches.json`

```json
{
  "groups": {
    "daniel-9-24-27": {
      "name": "Daniel 9:24-27 — The Seventy Sevens",
      "description": "Alternative reading based on consonantal text analysis",
      "study": "/reader/words/DANIEL-9",
      "default": false
    },
    "chodesh-renewed": {
      "name": "Renewed Moon (H2320)",
      "description": "'New moon' → 'renewed moon' — chodesh derives from 'to renew'",
      "study": "/reader/words/H2320",
      "default": true
    }
  },

  "patches": [
    {
      "id": "daniel-9-26-cut",
      "group": "daniel-9-24-27",
      "type": "phrase",
      "verses": ["Daniel 9:26"],
      "translations": {
        "kjv": {
          "find": "be cut off, but not for himself",
          "replace": "cut [a covenant] and vanish to himself"
        },
        "asv": {
          "find": "be cut off, and shall have nothing",
          "replace": "cut [a covenant] and vanish to himself"
        }
      },
      "tooltip": "Consonantal יכרת is identical for Qal ('shall cut') and Niphal ('shall be cut off'). כרת is the standard covenant verb (78x with בְּרִית in the OT). Daniel 9:27 explicitly mentions 'the covenant.'",
      "section": "#ambiguity-1"
    },
    {
      "id": "daniel-9-26-destroy",
      "group": "daniel-9-24-27",
      "type": "phrase",
      "verses": ["Daniel 9:26"],
      "translations": {
        "kjv": {
          "find": "the people of the prince that shall come shall destroy the city and the sanctuary",
          "replace": "the city and the holy place — he will destroy the people of the coming ruler"
        },
        "asv": {
          "find": "the people of the prince that shall come shall destroy the city and the sanctuary",
          "replace": "the city and the holy place — he will destroy the people of the coming ruler"
        }
      },
      "tooltip": "The traditional translation reorders the Hebrew. The verb ישחית is singular ('he will destroy'), matching Messiah as subject — not plural 'people.' Word order preserved: Messiah destroys the antichrist's forces.",
      "section": "#the-word-order-problem"
    },
    {
      "id": "chodesh-renewed-kjv",
      "group": "chodesh-renewed",
      "type": "strongs",
      "strongs": "H2320",
      "translations": {
        "kjv": {
          "find": "new moon",
          "replace": "renewed moon 🌕"
        },
        "asv": {
          "find": "new moon",
          "replace": "renewed moon 🌕"
        }
      },
      "tooltip": "H2320 חֹדֶשׁ (chodesh) derives from H2318 חָדַשׁ (chadash, 'to renew'). The moon is renewed, not new. See study for the full-moon-start-of-month argument.",
      "section": null
    }
  ]
}
```

### Key Fields

| Field | Purpose |
|-------|---------|
| `id` | Unique patch identifier (for analytics and storage) |
| `group` | Groups related patches — accept/reject as a unit |
| `type` | `phrase` (verse-specific), `strongs` (systematic), `presentation` (visual only) |
| `verses` | Which verses this patch applies to (phrase type only; strongs type applies everywhere) |
| `translations` | Per-translation find/replace pairs — each translation may word things differently |
| `tooltip` | Brief justification (2-4 sentences) shown on hover/tap |
| `section` | Deep-link anchor into the full study article |
| `default` | On the group — whether this is active by default |

### Study Articles

Full study articles live in the existing directories:

```
words/
  DANIEL-9.md          # Daniel 9:24-27 consonantal analysis (already written)
  H369.md              # The אַיִן pattern study (already written)
  H2320.md             # Renewed moon word study (already exists)

symbols/
  GRASS.md             # Grass = People (already written)
```

No new file structure needed for the articles — they already exist as word studies and symbol studies. The patch system just adds the structured overlay (JSON) that powers the interactive reader experience.

---

## UX Design

### Visual Language — Three States

| State | Visual | Text Shown | Meaning |
|-------|--------|-----------|---------|
| **Proposed** (not applied) | Subtle orange **dotted** underline | Original translation | "There's a question about this translation — tap to explore" |
| **Applied, unapproved** (default-on, user hasn't reviewed) | **Solid orange** text | Alternative reading | "We applied a study reading here — please review" |
| **Applied, approved** (user explicitly accepted) | **Blue** text | Alternative reading | "You reviewed and accepted this reading" |
| **Dismissed** | No highlight | Original translation | User chose to hide all indicators for this group |

The three colors escalate in confidence:
- **Dotted orange** = whisper ("psst, look at this")
- **Solid orange** = alert ("we changed something, heads up")
- **Blue** = resolved ("you reviewed this, it's your choice")

### User Flow — Proposed Patch (default-off, e.g., Daniel 9:24-27)

```
1. User reads Daniel 9:26 in KJV
2. Sees "be cut off, but not for himself" with orange DOTTED underline
   (original text shown — nothing replaced yet)
3. Hovers/taps → tooltip appears:
   ┌──────────────────────────────────┐
   │ Translation Question             │
   │                                  │
   │ Consonantal יכרת is identical    │
   │ for 'shall cut [a covenant]'     │
   │ and 'shall be cut off.'          │
   │ כרת is the standard covenant     │
   │ verb (78x in the OT).            │
   │                                  │
   │ Study: Daniel 9:24-27 →          │
   │ [Apply study reading]            │
   └──────────────────────────────────┘
4a. User taps "Study" → reads full article → decides
4b. User taps "Apply" → phrase changes to BLUE:
    "cut [a covenant] and vanish to himself"
    (all Daniel 9:24-27 patches apply + approve together)
5. Blue text tooltip shows:
   ┌──────────────────────────────────┐
   │ Study Reading (approved)         │
   │                                  │
   │ Original: "be cut off, but not   │
   │ for himself"                     │
   │                                  │
   │ [Show original] [Revert]         │
   └──────────────────────────────────┘
```

### User Flow — Default-On Patch (e.g., "renewed moon")

```
1. User reads a verse — sees "renewed moon 🌕" in SOLID ORANGE
   (alternative applied but not yet reviewed by user)
2. Hovers/taps → tooltip:
   ┌──────────────────────────────────┐
   │ Study Reading (review needed)    │
   │                                  │
   │ Original: "new moon"             │
   │ H2320 chodesh = 'to renew'      │
   │                                  │
   │ Study: Renewed Moon (H2320) →    │
   │ [Approve] [Revert to original]   │
   └──────────────────────────────────┘
3a. User taps "Approve" → text changes to BLUE
    (user has reviewed and accepted — settled)
3b. User taps "Revert" → text changes to original with
    orange DOTTED underline (proposed but not applied)
```

### State Transitions

```
              ┌─────────────┐
              │  Proposed    │ (dotted orange, original text)
              │  (default    │
              │   off)       │
              └──────┬───────┘
                     │ User taps "Apply"
                     ▼
              ┌─────────────┐         ┌─────────────┐
              │  Applied     │         │  Applied     │
              │  Unapproved  │────────▶│  Approved    │
              │  (solid      │ Approve │  (blue text) │
              │   orange)    │         └──────┬───────┘
              └──────┬───────┘                │
                     │ Revert                 │ Revert
                     ▼                        ▼
              ┌─────────────┐         ┌─────────────┐
              │  Proposed    │         │  Proposed    │
              │  (dotted     │         │  (dotted     │
              │   orange)    │         │   orange)    │
              └─────────────┘         └─────────────┘
```

Default-on patches start at "Applied, Unapproved" (solid orange). Default-off patches start at "Proposed" (dotted orange). Both can reach "Applied, Approved" (blue) through user action.

### Settings Page

```
Translation Patches
═══════════════════════════════════════

Active by Default
─────────────────
  ☑ Renewed Moon (H2320)                    47 verses
    "new moon" → "renewed moon" 🌕
  
  ☑ Full Moon Appointed Times (H3677)        3 verses
    Corrects kece rendering

  ☑ Evening Sacrifice (H6153)               28 verses
    "until the even" → evening sacrifice context

Study Readings (opt-in)
───────────────────────
  ☐ Daniel 9:24-27 — The Seventy Sevens     4 verses
    Covenant-cutting, vanishing, marriage pattern
  
  ☐ Zechariah 5 — Fire and the Scroll       3 verses
    Woman = fire offering, cubit = circumference

  ☐ Daniel 12 — Sacrifices Removed           2 verses
    Past tense reading of sacrifice removal
```

Each entry links to its full study. The verse count helps users gauge scope.

---

## Analytics (GoatCounter)

Track the decision funnel for each patch group:

```javascript
// User sees orange highlight (impression)
goatcounter.count({
  path: '/patch/seen/' + groupId,
  title: 'Patch Seen: ' + groupName,
  event: true
});

// User opens tooltip (engagement)
goatcounter.count({
  path: '/patch/tooltip/' + patchId,
  title: 'Patch Tooltip: ' + patchId,
  event: true
});

// User opens full study from tooltip
goatcounter.count({
  path: '/patch/study/' + groupId,
  title: 'Patch Study: ' + groupName,
  event: true
});

// User accepts patch group
goatcounter.count({
  path: '/patch/accept/' + groupId,
  title: 'Patch Accept: ' + groupName,
  event: true
});

// User reverts patch group
goatcounter.count({
  path: '/patch/revert/' + groupId,
  title: 'Patch Revert: ' + groupName,
  event: true
});
```

**Funnel analysis:**
- Seen → Tooltip = curiosity rate
- Tooltip → Study = interest rate
- Study → Accept = persuasion rate
- Accept → Revert = retention rate

Low persuasion rate on a specific patch = the argument needs strengthening or the tooltip needs rewriting. High revert rate = people accepted too quickly without understanding.

---

## Persistence

User's patch states stored in localStorage:

```json
{
  "patchStates": {
    "daniel-9-24-27": "approved",
    "chodesh-renewed": "approved",
    "zechariah-5-fire": "reverted",
    "evening-sacrifice": "dismissed"
  }
}
```

How states resolve:

| localStorage value | Group default: true | Group default: false |
|-------------------|--------------------|--------------------|
| **not present** | Applied, unapproved (solid orange) | Proposed (dotted orange) |
| `"approved"` | Applied, approved (blue) | Applied, approved (blue) |
| `"reverted"` | Proposed (dotted orange) | Proposed (dotted orange) |
| `"dismissed"` | No highlight | No highlight |

Key behaviors:
- Default-on groups start as **solid orange** (applied but unapproved) until the user approves or reverts
- Default-off groups start as **dotted orange** (proposed) until the user applies
- Once a user approves, the state is **blue** regardless of the group default
- Reverting always returns to **dotted orange** (proposed) — never removes the indicator entirely
- Dismissing removes all visual indicators for that group

---

## Scalability

| Concern | Assessment |
|---------|------------|
| **Number of patches** | Dozens of groups, maybe hundreds of individual patches. All JSON fits in memory trivially. |
| **Verse lookup speed** | Build a reverse index at load time: verse → applicable patches. O(1) lookup per verse render. |
| **Strong's patches** | Applied during the existing Strong's rendering pipeline — intercept the word before display. No new DOM traversal needed. |
| **New translations** | Adding a translation means adding `find/replace` entries to affected patches. Grep for `"translations"` and add the new key. |
| **Multiple patches on same verse** | Patches in the same group are coordinated. Patches in different groups on the same verse: apply in registry order, don't overlap the same phrase. |

---

## Maintenance

| Task | Effort |
|------|--------|
| **Add a new Strong's patch** | Add one entry to the JSON. Define find/replace per translation. Write tooltip. |
| **Add a new verse study group** | Write the MD article. Add group + patches to JSON. Define find/replace per translation per verse. |
| **Support a new Bible translation** | Add `find/replace` entries to each existing patch for the new translation. |
| **Update a tooltip** | Edit one string in the JSON. |
| **Validate links** | Script that checks all `section` anchors resolve in the linked study MD. |

---

## Implementation Phases

### Phase 1: Studies in the Reader

**Goal:** Users can browse and read verse studies alongside existing symbol/word/number studies. No interactive patching yet — just the articles.

- Add "Verse Studies" (or "Translation Studies") as a new section in the reader nav
- Route: `/reader/verse-studies/{slug}` (e.g., `/reader/verse-studies/DANIEL-9`)
- Render the existing MD files (DANIEL-9.md, H369.md, GRASS.md) in the study reader
- Add an index page listing all available verse studies
- No JSON patches, no orange/blue highlighting, no tooltips — just readable articles

**This lets you review and refine the study content before building the interactive layer.**

### Phase 2: Patch System — Data + Rendering

**Goal:** Orange/blue highlights appear in the reader on verses with patches.

- Create `data/translation-patches.json` with the patch registry
- Build reverse index at load time: verse → patches
- During verse rendering, check the index and apply highlights:
  - Orange dotted underline on phrases with inactive patches
  - Blue text on phrases with active patches
- Implement tooltips on hover/tap (brief justification + study link + accept/revert buttons)
- Implement group accept/reject logic
- Store user overrides in localStorage
- Wire up GoatCounter analytics events

### Phase 3: Strong's-Based Patches

**Goal:** Systematic word swaps (renewed moon, etc.) applied via Strong's number.

- Extend the patch applicator to handle `type: "strongs"` patches
- Integrate with existing Strong's rendering pipeline in `bible-reader.js`
- These patches apply everywhere the Strong's number appears, not per-verse
- Same orange/blue visual language and tooltip pattern

### Phase 4: Settings Page

**Goal:** Users can see all patches and toggle them in one place.

- Add "Translation Patches" section to settings
- Show groups organized by default-on / opt-in
- Toggle switches with verse counts and descriptions
- Link each group to its full study

---

## Open Questions

1. **Naming:** "Translation Patches" vs "Study Readings" vs "Translation Studies" for the user-facing label? "Patches" is technical. "Study Readings" is friendlier. "Insights" is vaguer but softer.

2. **Orange intensity:** Full orange background vs. subtle dotted underline? The underline is less alarming but may be too subtle on mobile. Could A/B test with analytics.

3. **Default-on tooltip wording:** For patches that are active by default (like renewed moon), the blue tooltip needs to feel helpful not presumptuous. "We've applied a study reading here" vs. "This word has been updated based on Hebrew analysis."

4. **Dismiss option:** Should users be able to permanently hide all patch highlights? Some users may find any annotations distracting. A global "hide all study readings" toggle in settings would cover this.

5. **Interaction with interlinear view:** When the user is viewing interlinear (Hebrew/Greek word-by-word), should patches still apply? The interlinear already shows the original — the patch might be redundant there. Possibly disable patches in interlinear mode.
