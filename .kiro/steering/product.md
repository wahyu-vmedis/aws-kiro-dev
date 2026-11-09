---
inclusion: always
---

# Product

A simple browser-based U.S. weather forecast app. The user types a city name, the app geocodes it via Nominatim, then fetches and displays a 5-period forecast from the National Weather Service (NWS) API.

## Key Behaviors

- City name is entered by the user and passed directly to the Nominatim API — never hardcoded.
- Forecast data comes from the NWS API (`api.weather.gov`), not a third-party weather service.
- Weather conditions are represented with Unicode emoji icons derived from NWS `shortForecast` text.
- Errors at any stage (geocoding, grid lookup, forecast fetch) are surfaced to the user with a descriptive message.
- The user can submit new searches after an error without reloading the page.
