# Weather App Geocoding Fix — Bugfix Design

## Overview

The `geocodeCity` function in `weather-app/index.html` has three compounding defects:
it calls a wrong URL (`https://geocoding.geo.census.gov/geocoder/locations/invalid`),
it parses the response using a structure that doesn't match the Nominatim JSON format,
and it omits the `User-Agent` header required by Nominatim's usage policy.

The fix is surgical: replace the `geocodeCity` function body only. No other functions
(`getNWSGridPoint`, `getNWSForecast`, `renderForecast`, `getWeather`, etc.) are touched,
ensuring the full downstream forecast pipeline continues to work exactly as before.

## Glossary

- **Bug_Condition (C)**: Any call to `geocodeCity` — because every invocation hits the wrong URL, the bug triggers on every search
- **Property (P)**: The desired outcome of a correct `geocodeCity` call — returns `{ lat: <number>, lon: <number> }` using the Nominatim API with proper headers
- **Preservation**: All behavior outside `geocodeCity` that must remain identical after the fix — NWS pipeline, forecast rendering, error display, temperature toggle, and error-clearing on new search
- **`geocodeCity(city)`**: The async function in `weather-app/index.html` responsible for converting a city name string into `{ lat, lon }` coordinates
- **Nominatim**: The OpenStreetMap geocoding service at `https://nominatim.openstreetmap.org/search`; returns a JSON array where each element has `.lat` and `.lon` as strings
- **NWS pipeline**: The sequence `getNWSGridPoint → getNWSForecast → renderForecast` that runs after a successful geocode

## Bug Details

### Bug Condition

The bug manifests on every city search. The `geocodeCity` function constructs a fetch URL
using the wrong base (`https://geocoding.geo.census.gov/geocoder/locations/invalid`),
which either causes a network failure or returns a response whose JSON structure is nothing
like the Nominatim format the rest of the parsing code assumes.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input — a non-empty city name string passed to geocodeCity
  OUTPUT: boolean

  // The bug fires on every call because the URL is always wrong
  RETURN fetch is called with a URL that does NOT start with
         'https://nominatim.openstreetmap.org/search'
         OR fetch options do NOT include a User-Agent header
         OR coordinate extraction does NOT use parseFloat(data[0].lat) / parseFloat(data[0].lon)
END FUNCTION
```

### Examples

- **Input: "Austin"** — fetch hits the census URL → network error → user sees "Geocoding failed: Failed to fetch". Expected: fetch hits Nominatim, returns `{ lat: 30.2672, lon: -97.7431 }`.
- **Input: "Seattle"** — same wrong URL → same error. Expected: `{ lat: 47.6062, lon: -122.3321 }`.
- **Input: "Springfield"** (ambiguous) — wrong URL → error before Nominatim even has a chance to disambiguate. Expected: Nominatim returns the first US match with valid coordinates.
- **Input: "Zzznotacity"** (non-existent) — wrong URL → network error rather than a clean "City not found" message. Expected: Nominatim returns `[]` → function throws `"City not found. Please try a different name."`.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- `getNWSGridPoint(lat, lon)` continues to call `https://api.weather.gov/points/{lat},{lon}` unchanged
- `getNWSForecast(gridId, gridX, gridY)` continues to fetch the 5-period forecast from the NWS gridpoints endpoint unchanged
- `renderForecast(city, periods)` continues to display the forecast table with period name, emoji icon, temperature, and short forecast unchanged
- The temperature unit toggle (`toggleUnit`) continues to let the user switch between °F and °C unchanged
- `showError(message)` continues to surface descriptive error messages for NWS failures unchanged
- `getWeather()` continues to clear previous errors and loading states on each new search unchanged

**Scope:**
All code paths that do NOT pass through `geocodeCity` are completely unaffected by this fix.
This includes:
- The NWS grid point and forecast fetch logic
- The forecast rendering and temperature conversion
- Error display and UI state management
- The temperature toggle and re-render logic

## Hypothesized Root Cause

Based on direct inspection of `weather-app/index.html`:

1. **Wrong Base URL**: The `geocodeCity` function uses `https://geocoding.geo.census.gov/geocoder/locations/invalid` as its base. This is not the Nominatim API and is not a valid endpoint, causing every fetch to fail immediately with a network error or 404.

2. **Missing Query Parameter Separator**: The URL construction appends `encodeURIComponent(city)` directly after `invalid` without a `?q=` separator, so even if the domain were correct, the URL would be malformed.

3. **Incompatible Response Parsing**: The code accesses `data[0].lat` and `data[0].lon` but does not apply `parseFloat`, leaving coordinates as strings. Additionally it checks `!data || data.length === 0` which is correct for Nominatim but was never reached because the fetch itself fails first.

4. **Missing User-Agent Header**: The `fetch` call passes no options object, so no `User-Agent` header is sent. Nominatim's usage policy requires this header; omitting it may cause requests to be rate-limited or rejected.

## Correctness Properties

Property 1: Bug Condition - Nominatim URL and Coordinate Extraction

_For any_ non-empty city name string passed to `geocodeCity`, the fixed function SHALL
send a fetch request to `https://nominatim.openstreetmap.org/search` with query parameters
`q={city}&countrycodes=us&format=json&limit=1`, a `User-Agent` header, and — when the
response is a non-empty array — SHALL return `{ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }`
as numbers, not strings.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Downstream NWS Pipeline Unchanged

_For any_ `{ lat, lon }` result produced by a successful `geocodeCity` call, the fixed code
SHALL produce exactly the same behavior as the original code for all subsequent steps —
NWS grid lookup, forecast fetch, table rendering, temperature toggle, and error display —
preserving every behavior defined in the Unchanged Behavior requirements.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

**File**: `weather-app/index.html`

**Function**: `geocodeCity(city)`

**Specific Changes**:

1. **Replace the base URL**: Change from `https://geocoding.geo.census.gov/geocoder/locations/invalid` to `https://nominatim.openstreetmap.org/search`.

2. **Fix the query string**: Build the URL as:
   ```
   'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(city) + '&countrycodes=us&format=json&limit=1'
   ```

3. **Add User-Agent header**: Pass a fetch options object with a `User-Agent` header:
   ```javascript
   response = await fetch(url, { headers: { 'User-Agent': 'weather-app/1.0' } });
   ```

4. **Apply parseFloat to coordinates**: Convert the string values from the Nominatim response:
   ```javascript
   return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
   ```

5. **No other changes**: All other functions, variable declarations, event handlers, and styles remain exactly as-is.

## Testing Strategy

### Validation Approach

Testing follows two phases: first, run exploratory checks against the unfixed code to confirm
the root cause; then, after applying the fix, run fix-checking and preservation-checking to
confirm correctness. Given the project's constraints (vanilla JS, no build tools, no test
framework), the primary validation method is `node --check weather-app/index.html` for syntax
validity, plus manual browser verification for behavioral correctness.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug on the UNFIXED code. Confirm or
refute the root cause analysis before writing any fix.

**Test Plan**: Open the app in a browser (or inspect the source) and observe the fetch URL
that `geocodeCity` constructs. Check the network tab in DevTools when a city is submitted.

**Test Cases**:

1. **Any city search (e.g., "Austin")**: Submit the form — observe that the network request
   goes to `geocoding.geo.census.gov` not `nominatim.openstreetmap.org` (will fail on unfixed code)
2. **Network tab inspection**: Confirm the URL is `https://geocoding.geo.census.gov/geocoder/locations/invalid...` (malformed, will fail)
3. **Error message observation**: Confirm the displayed error is exactly "Geocoding failed: Failed to fetch"
4. **Non-existent city (e.g., "Zzznotacity")**: Should show a clean "City not found" message, but instead shows the network error (wrong behavior on unfixed code)

**Expected Counterexamples**:
- The fetch URL does not begin with `https://nominatim.openstreetmap.org/search`
- The network request fails immediately with a CORS error, 404, or network error
- No `User-Agent` header is present in the outgoing request

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function
produces the expected behavior.

**Pseudocode:**
```
FOR ALL city WHERE isBugCondition(geocodeCity_original with city) DO
  result := geocodeCity_fixed(city)
  ASSERT typeof result.lat === 'number'
  ASSERT typeof result.lon === 'number'
  ASSERT fetch was called with URL starting 'https://nominatim.openstreetmap.org/search'
  ASSERT fetch options included User-Agent header
END FOR
```

### Preservation Checking

**Goal**: Verify that for all code paths that do NOT go through the broken `geocodeCity`
logic, the fixed code produces the same behavior as the original.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT getNWSGridPoint_original(lat, lon) === getNWSGridPoint_fixed(lat, lon)
  ASSERT getNWSForecast_original(...) === getNWSForecast_fixed(...)
  ASSERT renderForecast_original(...) === renderForecast_fixed(...)
  ASSERT toggleUnit_original() === toggleUnit_fixed()
  ASSERT showError_original(msg) === showError_fixed(msg)
END FOR
```

**Testing Approach**: Because the fix touches exactly one function (`geocodeCity`) and
leaves all other functions byte-for-byte identical, preservation is guaranteed by the
scope of the change. Manual browser testing of the full happy path after the fix is
sufficient to confirm the NWS pipeline still works end-to-end.

**Test Cases**:
1. **Happy path after fix**: Search "Austin" → geocode succeeds → NWS grid lookup runs → 5-period forecast table renders with emoji, temperature, short forecast
2. **Temperature toggle preservation**: After forecast renders, click toggle → temperatures convert between °F and °C correctly
3. **Error preservation (NWS failure)**: Mock or observe a NWS grid failure → error message displays without crashing
4. **New search after error**: Submit bad city → error shown → submit valid city → error clears, forecast loads

### Unit Tests

- Verify `geocodeCity` constructs the URL `https://nominatim.openstreetmap.org/search?q=Austin&countrycodes=us&format=json&limit=1` for input `"Austin"`
- Verify `geocodeCity` throws `"City not found. Please try a different name."` when given a mocked empty-array response
- Verify `geocodeCity` returns `{ lat: 30.2672, lon: -97.7431 }` (numbers) when given a mocked Nominatim response with string lat/lon values

### Property-Based Tests

- For any non-empty city string, the URL passed to fetch must start with `https://nominatim.openstreetmap.org/search?q=`
- For any mocked Nominatim response with string lat/lon values, the returned coordinates must be numbers (`typeof result.lat === 'number'`)
- For any valid `{ lat, lon }` passed to `getNWSGridPoint`, the function behavior is unchanged by the fix (since that function is not modified)

### Integration Tests

- Full search flow: enter "Seattle" → forecast table appears with 5 rows, each containing a period name, emoji, temperature in °F, and short forecast text
- Syntax validation: `node --check weather-app/index.html` passes with exit code 0 after the fix is applied
- Error flow: enter a city name that Nominatim cannot find → "City not found. Please try a different name." is displayed in the error div
