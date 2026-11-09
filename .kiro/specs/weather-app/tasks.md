# Implementation Plan: Weather App

## Overview

Build a two-file weather app (`index.html` + `start-server.ps1`) that geocodes a U.S. city via Nominatim, fetches a 5-day NWS forecast, and displays it in a table. No build tools, frameworks, classes, or caching.

## Tasks

- [x] 1. Create `start-server.ps1`
  - [x] 1.1 Implement the PowerShell HTTP listener script
    - Create `weather-app/start-server.ps1`
    - Add `HttpListener` on `http://localhost:8080/`
    - Serve `index.html` (resolved via `$PSScriptRoot`) for requests to `/`, with `Content-Type: text/html`
    - Return HTTP 404 for all other paths
    - Print `"Server running at http://localhost:8080 — press Ctrl+C to stop"` on successful start
    - Print `"Error: Port 8080 is unavailable."` and exit if `Start()` throws
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 2. Create `index.html` — page structure and styles
  - [x] 2.1 Scaffold the HTML skeleton with UI elements
    - Create `weather-app/index.html`
    - Add `<input id="cityInput">` for city name entry
    - Add `<button id="submitBtn">` wired to `onclick="getWeather()"`
    - Add `<div id="loading">` (hidden by default) for the loading indicator
    - Add `<div id="error">` (hidden by default) for error messages
    - Add `<div id="result">` (empty by default) for the forecast output
    - Include basic CSS (inline `<style>`) for layout and visibility toggling
    - _Requirements: 1.1, 1.4_

- [x] 3. Implement JavaScript utility functions
  - [x] 3.1 Implement `getWeatherEmoji(shortForecast)`
    - Pure function: lowercase the input, check keywords with `includes()` in priority order
    - Priority order: thunderstorm → snow → rain/shower → fog/haze → windy → sunny/clear → partly cloudy/mostly sunny → cloudy/overcast → default `🌡️`
    - _Requirements: 3.3_
  - [x] 3.2 Implement `showError(message)`
    - Set `#error` text content and make it visible
    - Clear `#result` inner HTML
    - _Requirements: 4.1, 4.2_
  - [x] 3.3 Implement `renderForecast(city, periods)`
    - Build an HTML string for a forecast table with columns: Day, Icon, Temperature (°F), Short Forecast
    - Call `getWeatherEmoji()` for each period's `shortForecast`
    - Inject the result into `#result`
    - _Requirements: 3.1, 3.2_

- [x] 4. Implement JavaScript fetch functions
  - [x] 4.1 Implement `geocodeCity(city)`
    - Build Nominatim URL: `https://nominatim.openstreetmap.org/search?q={encodeURIComponent(city)}&countrycodes=us&format=json&limit=1`
    - Return `{ lat, lon }` from the first result
    - Throw `"City not found. Please try a different name."` if results array is empty
    - Throw `"Geocoding failed: ..."` on network/HTTP error
    - _Requirements: 1.2, 2.1, 2.2_
  - [x] 4.2 Implement `getNWSGridPoint(lat, lon)`
    - Fetch `https://api.weather.gov/points/{lat},{lon}`
    - Return `{ gridId, gridX, gridY }` from `properties`
    - Throw `"NWS grid lookup failed: ..."` if response is not ok
    - _Requirements: 2.3, 2.5_
  - [x] 4.3 Implement `getNWSForecast(gridId, gridX, gridY)`
    - Fetch `https://api.weather.gov/gridpoints/{gridId}/{gridX},{gridY}/forecast`
    - Return the first 5 elements of `properties.periods`
    - Throw `"NWS forecast fetch failed: ..."` if response is not ok
    - _Requirements: 2.4, 2.5_

- [x] 5. Implement `getWeather()` entry point and wire everything together
  - [x] 5.1 Implement `getWeather()`
    - Read and trim `cityInput.value`; call `showError("Please enter a city name.")` and return early if empty
    - Show `#loading`, clear `#error` and `#result`
    - Call `geocodeCity` → `getNWSGridPoint` → `getNWSForecast` → `renderForecast` in sequence using `async/await` inside a `try/catch`
    - Call `showError(err.message)` in the catch block
    - Hide `#loading` in a `finally` block
    - _Requirements: 1.3, 1.4, 2.5, 3.4, 4.3_

- [x] 6. Validate syntax and checkpoint
  - [x] 6.1 Run `node --check index.html` to verify JavaScript syntax
    - Execute from the `weather-app/` directory
    - Fix any syntax errors reported before proceeding
    - _Requirements: all_

- [x] 7. Final checkpoint — Ensure all tests pass
  - Ensure `node --check index.html` passes, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP (none in this plan — all tasks are required)
- The project steering rules forbid caching, classes, interfaces, and additional test infrastructure; `node --check` is the only automated validation
- No property-based tests are included because the design has no Correctness Properties section
- Each task references specific requirements for traceability

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1"] },
    { "id": 1, "tasks": ["3.1", "3.2", "3.3"] },
    { "id": 2, "tasks": ["4.1", "4.2", "4.3"] },
    { "id": 3, "tasks": ["5.1"] },
    { "id": 4, "tasks": ["6.1"] }
  ]
}
```
