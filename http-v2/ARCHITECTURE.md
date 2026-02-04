# Calendar Engine Architecture

## Design Principles

1. **No Global Side Effects** - Functions are pure; one calculation never impacts another
2. **Explicit Dependencies** - No fallback to `window.state` or other globals
3. **Instance-Owned State** - Caches belong to engine instances, not globals
4. **Polymorphic Rules** - Year start rules are pluggable strategies
5. **Memoization** - Deterministic functions cache results within their instance

---

## Proper OO Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STATELESS SINGLETONS                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ AstroEngine (singleton, stateless)                                   │   │
│  │ ├── searchMoonPhase(phase, startDate, limitDays) → Date             │   │
│  │ ├── getSeasons(year) → { mar_equinox, jun_solstice, ... }           │   │
│  │ ├── searchRiseSet(body, observer, direction, startDate) → Date      │   │
│  │ ├── getEquator(body, date, observer) → { ra, dec }                  │   │
│  │ └── createObserver(lat, lon, elevation) → Observer                  │   │
│  │                                                                      │   │
│  │ NO application state. NO caches. Pure calculations.                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         YEAR START STRATEGIES                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  interface YearStartRule {                                                  │
│    getYearStart(year: number, location: Location, astro: AstroEngine): Date │
│  }                                                                          │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ EquinoxRule implements YearStartRule                                 │   │
│  │ └── getYearStart(year, location, astro) → spring equinox date       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ThirteenDaysBeforeRule implements YearStartRule                      │   │
│  │ └── getYearStart(year, location, astro) → equinox - 13 days         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ VirgoFeetRule implements YearStartRule                               │   │
│  │ ├── _cache: { [year_lat_lon]: VirgoResult }  ← INSTANCE-OWNED       │   │
│  │ └── getYearStart(year, location, astro) → first qualifying full moon│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         ENGINE INSTANCES                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ LunarCalendarEngine                                                  │   │
│  │ ├── constructor(astroEngine: AstroEngine)                           │   │
│  │ ├── _astro: AstroEngine (reference to singleton)                    │   │
│  │ ├── _yearStartRule: YearStartRule (pluggable strategy)              │   │
│  │ ├── _moonEventsCache: { [year]: Date[] }  ← INSTANCE-OWNED          │   │
│  │ ├── _calendarCache: { [year_lat_lon]: LunarYear }  ← INSTANCE-OWNED │   │
│  │ │                                                                    │   │
│  │ ├── configure(options) → this                                        │   │
│  │ ├── setYearStartRule(rule: YearStartRule) → this                    │   │
│  │ ├── generateYear(year, location) → LunarYear                        │   │
│  │ └── getDayInfo(calendar, month, day) → DayInfo                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         APPLICATION STATE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ AppStore (singleton application state)                               │   │
│  │ ├── _state: { context, content, ui }                                │   │
│  │ ├── _engine: LunarCalendarEngine (OWNS its instance)                │   │
│  │ │       └── _yearStartRule: VirgoFeetRule (OWNS its cache)          │   │
│  │ │                                                                    │   │
│  │ ├── dispatch(action) → void                                          │   │
│  │ ├── getState() → State                                               │   │
│  │ └── getEngine() → LunarCalendarEngine                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

```
User selects Dallas:
  → AppStore.dispatch({ type: 'SET_LOCATION', payload: { lat, lon } })
  → AppStore._recomputeDerived()
  → AppStore._engine.generateYear(year, { lat, lon })
      → engine._yearStartRule.getYearStart(year, location, engine._astro)
          → VirgoFeetRule checks its own _cache["2026_32.7767_-96.7970"]
          → If miss: calculates using astro, stores in _cache
          → Returns full moon date
      → engine builds calendar
  → Calendar rendered for Dallas

Timezone Guide wants Jerusalem data:
  → Creates NEW LunarCalendarEngine(getAstroEngine())
  → engine._yearStartRule = new VirgoFeetRule()  // NEW instance, NEW cache
  → engine.generateYear(year, jerusalemLocation)
      → VirgoFeetRule checks its own _cache (empty)
      → Calculates, stores in ITS cache
  → Returns Jerusalem calendar
  → Dallas calendar UNAFFECTED (different engine, different rule instance)
```

---

## Functions That Should NOT Reference Global State

These functions currently fall back to `window.state` and should be refactored:

| Function | File | Problem |
|----------|------|---------|
| `findVirgoFeetFullMoon` | astronomy-utils.js | Falls back to `state?.lat`, `state?.lon` |
| `getVirgoCalculation` | astronomy-utils.js | Falls back to AppStore or state |
| `getSunriseTimestamp` | astronomy-utils.js | Uses `state.lat`, `state.lon` directly |
| `getSunsetTimestamp` | astronomy-utils.js | Uses `state.lat`, `state.lon` directly |
| `formatTimeInObserverTimezone` | astronomy-utils.js | Uses `state.lon` |
| `getCurrentLocationName` | astronomy-utils.js | Uses `state?.lat`, `state?.lon` |

**Fix**: All functions should require explicit parameters. No fallbacks.

---

## Implementation Plan

### Phase 1: Move Virgo Cache to Engine Instance ✅ IMPLEMENTED

```javascript
class LunarCalendarEngine {
  constructor(astroEngine) {
    this.astro = astroEngine;
    this._virgoCache = {};      // Instance-owned Virgo cache
    this._moonEventsCache = {}; // Instance-owned moon events cache
    this.config = { ... };
  }
  
  // Requires explicit location - no fallbacks to global state
  generateYear(year, location) {
    if (!location) throw new Error('location required');
    // Uses instance caches
  }
  
  getYearStartPoint(year, location) {
    if (!location) throw new Error('location required');
    if (this.config.yearStartRule === 'virgoFeet') {
      return this._findVirgoFeetFullMoon(year, location);
    }
    // ...
  }
  
  _findVirgoFeetFullMoon(year, location) {
    const cacheKey = `${year}_${location.lat.toFixed(4)}_${location.lon.toFixed(4)}`;
    if (this._virgoCache[cacheKey]) {
      return new Date(this._virgoCache[cacheKey].selectedFullMoon);
    }
    // Calculate and store in instance cache
    this._virgoCache[cacheKey] = result;
    return result.date;
  }
  
  getVirgoCalculation(year, location) {
    const cacheKey = `${year}_${location.lat.toFixed(4)}_${location.lon.toFixed(4)}`;
    return this._virgoCache[cacheKey] || null;
  }
}
```

### Deprecated Global Functions

The following global functions are now deprecated wrappers:
- `findVirgoFeetFullMoon(year, location)` → delegates to `AppStore.getEngine()._findVirgoFeetFullMoon()`
- `getVirgoCalculation(year, location)` → delegates to `AppStore.getEngine().getVirgoCalculation()`

### Removed Global State

- `AstroEngines.virgoCache` - REMOVED (was global, now instance-owned)
- `window.state` fallbacks - REMOVED from Virgo functions (location is now required)

### Phase 2: Polymorphic Year Start Rules (Future)

```javascript
// Base interface
class YearStartRule {
  getYearStart(year, location, astroEngine) {
    throw new Error('Abstract method');
  }
}

// Implementations
class EquinoxRule extends YearStartRule { ... }
class VirgoFeetRule extends YearStartRule { ... }
class ThirteenDaysBeforeRule extends YearStartRule { ... }

// Usage
const engine = new LunarCalendarEngine(getAstroEngine());
engine.setYearStartRule(new VirgoFeetRule());
```

---

## Benefits of This Design

1. **True Isolation**: Each `LunarCalendarEngine` instance owns its caches
2. **No Global Pollution**: Creating engines for timezone guide can't affect main calendar
3. **Testable**: Each component can be tested in isolation
4. **Memoization**: Caches are per-instance, results are reused within context
5. **Polymorphic**: Easy to add new year start rules (e.g., Karaite, Hillel II)
6. **Explicit Dependencies**: No hidden state, all inputs are parameters
