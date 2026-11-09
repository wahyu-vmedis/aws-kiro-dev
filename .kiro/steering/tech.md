---
inclusion: always
---

# Tech Stack

- **Language**: Vanilla HTML + JavaScript (no frameworks, no build tools, no TypeScript)
- **CSS**: Inline `<style>` in `index.html` — no external stylesheets or CSS frameworks
- **APIs**:
  - [Nominatim](https://nominatim.openstreetmap.org) — geocoding (city name → lat/lon), used with `countrycodes=us` to avoid CORS issues
  - [NWS API](https://api.weather.gov) — grid point resolution and 5-period daily forecast
- **Server**: PowerShell `System.Net.HttpListener` — no Node.js, no Python, no extra modules

## Constraints

- No classes, interfaces, or caching
- No external JS libraries or npm packages
- All JS lives as inline `<script>` inside `index.html`
- City names must come from user input — never hardcoded in source

## Commands

**Start the local server:**
```powershell
.\weather-app\start-server.ps1
```
Then open `http://localhost:8080` in a browser.

**Validate JavaScript syntax:**
```
node --check weather-app/index.html
```
If this passes, no further testing is required.
