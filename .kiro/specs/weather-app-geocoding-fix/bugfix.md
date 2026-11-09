# Bugfix Requirements Document

## Introduction

The city search feature is broken. Every search returns a "Geocoding failed: Failed to fetch" error,
preventing users from getting any weather forecast. The root cause is that the `geocodeCity` function
in `weather-app/index.html` was changed to call an incorrect URL
(`https://geocoding.geo.census.gov/geocoder/locations/invalid`) instead of the correct Nominatim
geocoding API (`https://nominatim.openstreetmap.org/search`). Additionally, the response parsing
logic does not match the Nominatim response format, and the required `User-Agent` header is missing.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user submits any city name THEN the system sends a fetch request to the wrong URL (`https://geocoding.geo.census.gov/geocoder/locations/invalid`) causing a network error or HTTP failure
1.2 WHEN the geocoding fetch fails with a network error THEN the system displays "Geocoding failed: Failed to fetch" and no forecast is shown
1.3 WHEN a geocoding response is received THEN the system attempts to parse it using an incorrect structure incompatible with the Nominatim JSON format
1.4 WHEN the `geocodeCity` function calls `fetch` THEN the system sends no `User-Agent` header, violating Nominatim's usage policy

### Expected Behavior (Correct)

2.1 WHEN a user submits any U.S. city name THEN the system SHALL send a fetch request to `https://nominatim.openstreetmap.org/search` with query parameters `q={city}&countrycodes=us&format=json&limit=1`
2.2 WHEN the Nominatim API returns a non-empty array THEN the system SHALL extract the coordinates by reading `data[0].lat` and `data[0].lon` and converting them to numbers via `parseFloat`
2.3 WHEN the `geocodeCity` function calls `fetch` THEN the system SHALL include a `User-Agent` header in the request to comply with Nominatim's usage policy
2.4 WHEN the Nominatim API returns an empty array THEN the system SHALL throw an error with the message "City not found. Please try a different name."

### Unchanged Behavior (Regression Prevention)

3.1 WHEN geocoding succeeds THEN the system SHALL CONTINUE TO call the NWS grid point API (`https://api.weather.gov/points/{lat},{lon}`) with the resolved coordinates
3.2 WHEN the NWS grid point lookup succeeds THEN the system SHALL CONTINUE TO fetch the 5-period forecast from the NWS gridpoints forecast endpoint
3.3 WHEN the forecast data is retrieved THEN the system SHALL CONTINUE TO display it in a table with period name, emoji icon, temperature, and short forecast
3.4 WHEN forecast data is displayed THEN the system SHALL CONTINUE TO show the temperature unit toggle button allowing the user to switch between °F and °C
3.5 WHEN any API call fails (grid lookup or forecast fetch) THEN the system SHALL CONTINUE TO display a descriptive error message without crashing
3.6 WHEN a user submits a new city after an error THEN the system SHALL CONTINUE TO clear the previous error and attempt a fresh forecast lookup
