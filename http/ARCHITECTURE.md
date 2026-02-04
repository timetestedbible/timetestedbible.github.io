# Calendar & Event System Architecture

## Core Components

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         app-store.js                                     │
│  ═══════════════════════════════════════════════════════════════════    │
│  Central State Management (Singleton)                                    │
│                                                                          │
│  STATE:                           DERIVED:                               │
│  • lat, lon (location)            • lunarMonths[]                        │
│  • selectedDate (JD)              • currentMonth                         │
│  • moonPhase ('full'/'new')       • currentDay                           │
│  • dayStartTime                   • priestly course info                 │
│  • yearStartRule                  • feasts                               │
│  • sabbathMode                                                           │
│  • priestlyCycleAnchor                                                   │
│                                                                          │
│  OWNS: LunarCalendarEngine instance (_engine)                            │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ uses
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    lunar-calendar-engine.js                              │
│  ═══════════════════════════════════════════════════════════════════    │
│  PURE CALCULATION ENGINE (Stateless Class)                               │
│                                                                          │
│  API:                                                                    │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ engine.configure(options)    → Set moonPhase, dayStartTime...  │     │
│  │ engine.generateYear(year, location)  → Full lunar calendar     │     │
│  │ engine.findMoonEvents(year)  → Array of new/full moons         │     │
│  │ engine.findLunarDay(calendar, date)  → { month, day }          │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  INTERNAL CACHES:                                                        │
│  • _moonCache[year][moonPhase] = moonEvents[]                            │
│  • _yearCache[year][moonPhase][yearStartRule] = calendar                 │
│                                                                          │
│  DEPENDS ON: astroEngine (Swiss Ephemeris / Astronomy Engine)            │
│  NO UI DEPENDENCIES - Can be used standalone                             │
└─────────────────────────────────────────────────────────────────────────┘
```

## Priestly Cycle Calculation

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    priestly-divisions.js                                 │
│  ═══════════════════════════════════════════════════════════════════    │
│  PRIESTLY COURSE CALCULATIONS                                            │
│                                                                          │
│  PRIMARY API:                                                            │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ getPriestlyCourse(date, lunarDay, lunarMonth, profile)         │     │
│  │   → { order: 8, course: "Abijah", meaning: "...", ... }        │     │
│  │                                                                 │     │
│  │ getPriestlyCourseForDay(dayObj, month, profile)                │     │
│  │   → Wrapper for calendar day objects                           │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  ANCHOR CALCULATION:                                                     │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ getCachedReferenceJD(profile)                                  │     │
│  │   • 'destruction': 9th of Av, 70 AD → Jehoiarib (1) serving    │     │
│  │   • 'dedication': 15th of Month 7, 959 BC → Jehoiarib (1)     │     │
│  │   Uses LunarCalendarEngine to find exact lunar dates           │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  WEEK INDEX CALCULATION:                                                 │
│  • Lunar Sabbath: weeks = (lunarMonth-1)*4 + weekInMonth                 │
│  • Saturday Sabbath: weeks = floor((targetJD - referenceJD) / 7)         │
│  • Course = ((referenceWeekIndex + weeksFromAnchor) % 24) + 1            │
│                                                                          │
│  CACHES: referenceJDCache[profileHash] = JD                              │
└─────────────────────────────────────────────────────────────────────────┘
```

## Event Resolution

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      event-resolver.js                                   │
│  ═══════════════════════════════════════════════════════════════════    │
│  DATE RESOLUTION FROM EVENT DEFINITIONS                                  │
│                                                                          │
│  MAIN API:                                                               │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ resolveEvent(event, profile, epochs, context) → JD             │     │
│  │ resolveAllEvents(data, profile) → Map<eventId, resolvedEvent>  │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  DATE SPEC TYPES:                                                        │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ { gregorian: { year, month, day } }                            │     │
│  │ { lunar: { year, month, day } }                                │     │
│  │ { relative: { to_event, offset: { days/lunar_years } } }       │     │
│  │ { priestly_cycle: { course, after_event, offset } }       ◄────┼─┐   │
│  └────────────────────────────────────────────────────────────────┘ │   │
│                                                                      │   │
│  PRIESTLY CYCLE RESOLUTION:                                          │   │
│  ┌────────────────────────────────────────────────────────────────┐ │   │
│  │ priestlyCycleToJulianDay(cycleSpec, profile, epochs, context)  │ │   │
│  │   1. Resolve after_event → get referenceJD                     │ │   │
│  │   2. Iterate day-by-day from referenceJD                       │ │   │
│  │   3. Call getPriestlyCourse() for each day ◄───────────────────┼─┘   │
│  │   4. Return JD when target course found                        │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  CONVERSION UTILITIES:                                                   │
│  • julianDayToGregorian(jd) ↔ gregorianToJulianDay(y,m,d)               │
│  • julianDayToLunar(jd, profile) - APPROXIMATE (±1 day)                 │
│  • lunarToJulianDay(lunar, year, profile) - Uses calendar engine         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. Calendar Generation (User Changes Date/Location)

```
User Action (change date/profile)
        │
        ▼
┌──────────────────┐
│ AppStore.dispatch│
│ { type: 'SET_*' }│
└────────┬─────────┘
         │
         ▼
┌─────────────────────────┐
│ AppStore._recomputeDerived()│
│   • needsRegenerate?    │
└────────┬────────────────┘
         │ YES
         ▼
┌─────────────────────────────────────────┐
│ AppStore._engine.generateYear(year, loc)│
│   ┌─────────────────────────────────┐   │
│   │ LunarCalendarEngine             │   │
│   │  1. findMoonEvents(year)        │   │
│   │  2. getYearStartPoint()         │   │
│   │  3. Calculate month boundaries  │   │
│   │  4. Generate day objects        │   │
│   └─────────────────────────────────┘   │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Store calendar in       │
│ _derived.lunarMonths    │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ AppStore._populateDayData()│
│   Add feasts, priestly  │
│   courses to each day   │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Notify UI subscribers   │
│   Views re-render       │
└─────────────────────────┘
```

### 2. Priestly Course for Calendar Day (UI Display)

```
Calendar day needs priestly course
        │
        ▼
┌─────────────────────────────────────────┐
│ getPriestlyCourseForDay(dayObj, month, profile)│
│   Extract: date, lunarDay, lunarMonth    │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ getPriestlyCourse(date, lunarDay, lunarMonth, profile)│
└────────┬────────────────────────────────┘
         │
         ├─────────────────┐
         │                 │ Cache miss
         ▼                 ▼
┌───────────────┐  ┌──────────────────────────────┐
│ getCachedRef  │  │ Calculate referenceJD        │
│ erence JD()   │  │  • Create temp LunarCalendar │
│               │  │  • Find 9th Av 70 AD (JD)    │
│   Cache hit   │  │  • Store in cache            │
└───────┬───────┘  └──────────────┬───────────────┘
        │                         │
        └────────────┬────────────┘
                     │
                     ▼
        ┌─────────────────────────────┐
        │ Calculate week index        │
        │                             │
        │ LUNAR:                      │
        │   weeks = (month-1)*4       │
        │         + weekInMonth       │
        │                             │
        │ SATURDAY:                   │
        │   weeks = (JD - refJD) / 7  │
        └────────────┬────────────────┘
                     │
                     ▼
        ┌─────────────────────────────┐
        │ course = weekIndex % 24 + 1 │
        │ return PRIESTLY_DIVISIONS[i]│
        └─────────────────────────────┘
```

### 3. Event Resolution (Historical Events)

```
Event: john-baptist-conception
  start: {
    priestly_cycle: {
      course: "Abijah",           ─┐
      after_event: "john-birth",   │ From JSON
      offset: { days: -280 }      ─┘
    }
  }
        │
        ▼
┌─────────────────────────────────────────┐
│ resolveEvent(event, profile, ...)        │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ priestlyCycleToJulianDay(cycleSpec, ...)│
│                                          │
│  1. Resolve "john-birth" → JD            │
│  2. Apply offset: -280 days → afterJD    │
│  3. Find target course (Abijah = 8)      │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Day-by-day search from afterJD          │
│                                          │
│  for (day = afterJD; day < afterJD+200) │
│    getPriestlyCourse(day, null, null)───┼─► Uses JD-based
│    if (course == 8) return day          │   calculation
│                                          │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Return: Conception JD = week_start + 8  │
│   (end of service week + travel home)   │
└─────────────────────────────────────────┘
```

## Key Design Principles

### 1. Separation of Concerns
- **app-store.js**: UI state, navigation, profile management
- **lunar-calendar-engine.js**: Pure astronomical calculations
- **priestly-divisions.js**: Priestly cycle logic only
- **event-resolver.js**: Event → JD resolution

### 2. Stateless Calculations
- `LunarCalendarEngine` is a stateless class - you pass config, get results
- Can create temporary instances for one-off calculations
- Caches are per-instance, not global

### 3. Profile-Based Configuration
All calendar calculations depend on profile settings:
```javascript
profile = {
  moonPhase: 'full' | 'new',           // When does month start?
  dayStartTime: 'morning' | 'evening', // When does day start?
  yearStartRule: 'equinox' | 'virgoFeet',
  sabbathMode: 'lunar' | 'saturday',
  priestlyCycleAnchor: 'destruction' | 'dedication'
}
```

### 4. Anchor Points
Priestly cycle uses historical anchor:
- **Temple Destruction (70 AD)**: 9th of Av - Jehoiarib serving
- **Temple Dedication (959 BC)**: 15th of Month 7 - Jehoiarib serving
Both are validated to align (24 courses × weeks should match)

## File Dependencies

```
astronomy-engine-abstraction.js
        │
        │ provides astroEngine
        ▼
lunar-calendar-engine.js ◄───────────────────────┐
        │                                         │
        │ used by                                 │ creates temp instances
        ▼                                         │
app-store.js ─────────────────────────────────────┤
        │                                         │
        │ provides state                          │
        ▼                                         │
priestly-divisions.js ────────────────────────────┘
        │
        │ provides getPriestlyCourse()
        ▼
event-resolver.js
        │
        │ resolves events to JD
        ▼
biblical-timeline.js (UI rendering)
```

## Common Mistakes to Avoid

1. **Don't bypass the calendar engine** - Always use `LunarCalendarEngine` for lunar date calculations, not hand-rolled formulas

2. **Don't ignore the profile** - Calendar results depend on profile settings. Always pass profile to functions.

3. **Don't assume month lengths** - Lunar months vary (29-30 days). Use the generated calendar.

4. **Don't cache across profiles** - Different profiles produce different calendars. Clear caches when profile changes.

5. **Don't mix coordinate systems** - JD (Julian Day) is the universal reference. Convert to/from Gregorian or Lunar through proper functions.
