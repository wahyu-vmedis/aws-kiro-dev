# Implementation Plan

## Overview

Fix the broken `geocodeCity` function in `weather-app/index.html` by replacing the wrong Census Bureau URL with the correct Nominatim API endpoint, adding the required `User-Agent` header, and applying `parseFloat` to the returned coordinates. The fix is surgical — only the `geocodeCity` function body is modified. All other functions remain unchanged.

## Tasks

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Nominatim URL and Coordinate Extraction
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to the concrete failing case - any non-empty city string passed to `geocodeCity` triggers the wrong URL
  - Open `weather-app/index.html` in a browser and submit a city name (e.g., "Austin")
  - Open DevTools → Network tab and observe the outgoing fetch request URL
  - Confirm the URL begins with `https://geocoding.geo.census.gov/geocoder/locations/invalid` (wrong URL)
  - Confirm no `User-Agent` header is present in the outgoing request
  - Confirm the UI displays "Geocoding failed: Failed to fetch" instead of a forecast
  - Also test "Zzznotacity" — confirm it shows the network error rather than a clean "City not found" message
  - The test assertions (expected behavior) are: URL starts with `https://nominatim.openstreetmap.org/search`, `User-Agent` header is present, and coordinates are numbers
  - Run on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct — it proves the bug exists)
  - Document counterexamples found (e.g., "geocodeCity('Austin') fetches https://geocoding.geo.census.gov/geocoder/locations/invalid... instead of Nominatim")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Downstream NWS Pipeline Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: `getNWSGridPoint`, `getNWSForecast`, `renderForecast`, `toggleUnit`, `showError`, and `getWeather` are not called by `geocodeCity` — they are independent
  - Observe the source of `weather-app/index.html` and confirm these functions are byte-for-byte unmodified relative to the pre-bug baseline
  - Write property-based test: for any valid `{ lat, lon }` pair, `getNWSGridPoint` constructs the URL `https://api.weather.gov/points/{lat},{lon}` unchanged
  - Write property-based test: for any forecast periods array, `renderForecast` renders a table with period name, emoji, temperature, and short forecast unchanged
  - Observe: `toggleUnit` switches between °F and °C and re-renders using `lastPeriods` — this path does not touch `geocodeCity`
  - Run tests on UNFIXED code (these functions are untouched, so they should pass)
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 3. Fix the geocodeCity function in weather-app/index.html

  - [x] 3.1 Implement the fix
    - Replace the base URL from `https://geocoding.geo.census.gov/geocoder/locations/invalid` to `https://nominatim.openstreetmap.org/search`
    - Fix the query string to: `'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(city) + '&countrycodes=us&format=json&limit=1'`
    - Add a `User-Agent` header: pass `{ headers: { 'User-Agent': 'weather-app/1.0' } }` as the second argument to `fetch`
    - Apply `parseFloat` to the extracted coordinates: `return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }`
    - Change NO other code — all other functions (`getNWSGridPoint`, `getNWSForecast`, `renderForecast`, `toggleUnit`, `showError`, `getWeather`) remain exactly as-is
    - Run `node --check weather-app/index.html` to validate JavaScript syntax — if this passes, no further syntax checking is needed
    - _Bug_Condition: isBugCondition(input) — fetch URL does NOT start with 'https://nominatim.openstreetmap.org/search', OR fetch options do NOT include a User-Agent header, OR coordinates are not extracted via parseFloat(data[0].lat) / parseFloat(data[0].lon)_
    - _Expected_Behavior: fetch URL starts with 'https://nominatim.openstreetmap.org/search?q=', User-Agent header is present, and returned { lat, lon } values are numbers (typeof === 'number')_
    - _Preservation: getNWSGridPoint, getNWSForecast, renderForecast, toggleUnit, showError, and getWeather are unchanged — only the geocodeCity function body is modified_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Nominatim URL and Coordinate Extraction
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - Submit "Austin" in the browser — confirm the network request goes to `https://nominatim.openstreetmap.org/search?q=Austin&countrycodes=us&format=json&limit=1`
    - Confirm the `User-Agent` header is present in the outgoing request
    - Confirm the returned coordinates are numbers (check DevTools or forecast renders correctly)
    - Submit "Zzznotacity" — confirm the UI shows "City not found. Please try a different name."
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [-] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Downstream NWS Pipeline Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Submit "Austin" and confirm the full forecast pipeline runs: geocode → NWS grid lookup → 5-period forecast table renders with period name, emoji, temperature in °F, and short forecast
    - Click the temperature toggle — confirm it switches between °F and °C and re-renders the forecast correctly
    - Trigger an NWS failure scenario (e.g., submit a valid city and observe any NWS error is displayed without crashing)
    - Submit a bad city name to trigger an error, then submit a valid city — confirm the error clears and a fresh forecast loads
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [~] 4. Checkpoint - Ensure all tests pass
  - Run `node --check weather-app/index.html` one final time — confirm exit code 0
  - Confirm the bug condition exploration test (task 1 / task 3.2) passes
  - Confirm the preservation tests (task 2 / task 3.3) pass
  - Ensure all tests pass; ask the user if any questions arise

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2"] },
    { "id": 2, "tasks": ["3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3"] },
    { "id": 4, "tasks": ["4"] }
  ]
}
```

## Notes

- Tasks 1 and 2 MUST be completed before task 3.1. Writing tests against unfixed code is essential to confirm the bug exists and establish a behavioral baseline.
- Task 1 is expected to FAIL on unfixed code — that failure is proof the bug is real.
- Task 2 is expected to PASS on unfixed code — those tests capture the baseline behavior to preserve.
- The fix in task 3.1 touches only the `geocodeCity` function body. No other code changes.
- `node --check weather-app/index.html` is the authoritative syntax validation step for this vanilla JS project. If it passes, no further test infrastructure is needed.
- Tasks 3.2 and 3.3 re-run the same tests from tasks 1 and 2 respectively — do not write new tests.
