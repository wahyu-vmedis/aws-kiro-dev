# Design Document: Weather App

## Overview

A single-page HTML/JavaScript weather application served locally on `localhost:8080`. The user types a U.S. city name, the app resolves it to coordinates via Nominatim, then fetches and displays a 5-day forecast from the National Weather Service (NWS) API. No build tools, no frameworks, no caching, no classes — just two files: `index.html` and `start-server.ps1`.

---

## Architecture

The app is entirely client-side. All logic lives inside `index.html` as inline `<script>` tags. The PowerShell script acts only as a static file server; it has no application logic.

```
Browser
  └── index.html (HTML + inline JS)
        ├── User submits city name
        ├── fetch → Nominatim  (geocoding)
        ├── fetch → NWS /points  (grid resolution)
        └── fetch → NWS /gridpoints/.../forecast  (5-day data)

localhost:8080
  └── start-server.ps1  (PowerShell HTTP listener, serves index.html)
```

Data flows strictly forward through three sequential async steps. Each step must succeed before the next begins. Errors at any step halt the chain and display a message to the user.

---

## Components and Interfaces

### File Structure

```
weather-app/
├── index.html        # The entire app (HTML + CSS + JS inline)
└── start-server.ps1  # PowerShell HTTP server on localhost:8080
```

No additional files are needed.

### index.html — UI Structure

The page contains these elements:

| Element | Purpose |
|---|---|
| `<input id="cityInput">` | City name text field |
| `<button id="submitBtn">` | Triggers the forecast fetch |
| `<div id="loading">` | Loading spinner/text, hidden by default |
| `<div id="error">` | Error message display, hidden by default |
| `<div id="result">` | Holds the city name heading and forecast table, empty by default |

### index.html — JavaScript Functions

The script section exposes these plain functions (no classes):

**`getWeather()`**
- Entry point called by the submit button's `onclick`.
- Reads `cityInput.value`, validates it is non-empty (trimmed).
- Shows the loading indicator and clears previous results/errors.
- Calls the three fetch steps in sequence using `async/await`.
- Hides the loading indicator when done.

**`geocodeCity(city)`**
- Builds the Nominatim URL: `https://nominatim.openstreetmap.org/search?q={city}&countrycodes=us&format=json&limit=1`
- The city string is passed directly to `encodeURIComponent()` — no modification.
- Returns `{ lat, lon }` from the first result, or throws if results are empty.

**`getNWSGridPoint(lat, lon)`**
- Fetches `https://api.weather.gov/points/{lat},{lon}`.
- Returns `{ gridId, gridX, gridY }` from `properties.gridId`, `properties.gridX`, `properties.gridY`.
- Throws a descriptive error if the response is not ok.

**`getNWSForecast(gridId, gridX, gridY)`**
- Fetches `https://api.weather.gov/gridpoints/{gridId}/{gridX},{gridY}/forecast`.
- Returns the first 5 elements of `properties.periods`.
- Throws a descriptive error if the response is not ok.

**`getWeatherEmoji(shortForecast)`**
- Pure function. Takes the NWS `shortForecast` string, lowercases it, and checks for keywords using `includes()`.
- Returns the mapped emoji or the default `🌡️`.
- See emoji mapping table in Data Models section.

**`renderForecast(city, periods)`**
- Builds an HTML string for the forecast table and injects it into `#result`.
- Calls `getWeatherEmoji()` for each period.

**`showError(message)`**
- Sets `#error` text and makes it visible.
- Clears `#result`.

---

## Data Models

### Nominatim Response (relevant fields)

```json
[
  {
    "lat": "40.7128",
    "lon": "-74.0060"
  }
]
```

Only `lat` and `lon` from the first array element are used.

### NWS `/points` Response (relevant fields)

```json
{
  "properties": {
    "gridId": "OKX",
    "gridX": 33,
    "gridY": 37
  }
}
```

### NWS `/forecast` Response (relevant fields)

```json
{
  "properties": {
    "periods": [
      {
        "name": "Tonight",
        "temperature": 58,
        "temperatureUnit": "F",
        "shortForecast": "Mostly Clear"
      }
    ]
  }
}
```

Only the first 5 elements of `periods` are used.

### Weather Icon Emoji Mapping

The `getWeatherEmoji(shortForecast)` function lowercases the input and checks keywords in this priority order:

| Keyword(s) to check (`.includes()`) | Emoji |
|---|---|
| `"thunderstorm"` | ⛈️ |
| `"snow"` | 🌨️ |
| `"rain"` or `"shower"` | 🌧️ |
| `"fog"` or `"haze"` | 🌫️ |
| `"windy"` | 💨 |
| `"sunny"` or `"clear"` | ☀️ |
| `"partly cloudy"` or `"mostly sunny"` | ⛅ |
| `"cloudy"` or `"overcast"` | ☁️ |
| _(no match)_ | 🌡️ |

Thunderstorm is checked before rain because "Thunderstorm" can also match rain-related keywords. The order ensures more specific conditions take priority.

---

## Error Handling

All errors are caught in `getWeather()` with a single `try/catch`. Each throwing function includes a descriptive prefix in its error message identifying the failed step:

| Failure point | Error message prefix |
|---|---|
| Empty city input | `"Please enter a city name."` |
| Nominatim returns no results | `"City not found. Please try a different name."` |
| Nominatim network/HTTP error | `"Geocoding failed: ..."` |
| NWS /points HTTP error | `"NWS grid lookup failed: ..."` |
| NWS /forecast HTTP error | `"NWS forecast fetch failed: ..."` |

After an error is displayed, the input field and submit button remain fully interactive — no page reload required.

---

## PowerShell Server Script Design (`start-server.ps1`)

The script uses the built-in .NET `HttpListener` class — no extra modules required.

**Logic:**

1. Create an `HttpListener` and add prefix `http://localhost:8080/`.
2. Call `Start()`. If it throws, print `"Error: Port 8080 is unavailable."` and exit.
3. Print `"Server running at http://localhost:8080 — press Ctrl+C to stop"`.
4. Enter an infinite loop: call `GetContext()`, read the request path.
5. For any request to `/` (or the root), read `index.html` from the same directory as the script, respond with `Content-Type: text/html`, write the file bytes, and close the response.
6. For any other path, return a 404.

The script resolves `index.html` using `$PSScriptRoot` so it works regardless of where PowerShell is invoked from.

---

## Testing Strategy

Per project steering rules, the only validation required is:

```
node --check index.html
```

If `node --check` passes, the JavaScript is syntactically valid. No further test infrastructure (Jest, property-based testing, etc.) is needed for this project.

Manual smoke test after implementation:
1. Run `.\start-server.ps1` in PowerShell.
2. Open `http://localhost:8080` in a browser.
3. Enter a valid U.S. city (e.g., "Austin") — verify the 5-day forecast table appears.
4. Enter an invalid city (e.g., "zzzzzz") — verify the "City not found" error message appears.
5. Submit with an empty field — verify the "Please enter a city name" error appears.
6. After an error, enter a valid city again — verify the new forecast replaces the error without a page reload.
