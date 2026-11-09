# Requirements Document

## Introduction

A simple browser-based weather app that allows a user to enter a U.S. city name, resolves that city to geographic coordinates using the Nominatim geocoding API, then fetches and displays a 5-day forecast from the National Weather Service (NWS) API. The app is a single HTML page with vanilla JavaScript and is served locally on localhost:8080 via a PowerShell HTTP server script.

## Glossary

- **App**: The single-page HTML/JavaScript weather application served on localhost:8080.
- **User**: The person interacting with the App in a web browser.
- **City_Input**: The text field in the App where the User types a U.S. city name.
- **Nominatim**: The OpenStreetMap geocoding service at `nominatim.openstreetmap.org` used to convert a city name to latitude/longitude coordinates.
- **NWS_API**: The National Weather Service API at `api.weather.gov` used to retrieve forecast data.
- **Coordinates**: A latitude/longitude pair returned by Nominatim for a given city name.
- **Grid_Point**: The NWS forecast grid point (gridId, gridX, gridY) resolved from Coordinates via the NWS points endpoint.
- **Forecast**: The weather data object returned by the NWS daily forecast endpoint for a Grid_Point.
- **Forecast_Table**: A table displaying the first 5 daily periods of Forecast data with columns for Day, Icon, Temperature (°F), and Short Forecast.
- **Weather_Icon**: A Unicode emoji representing the weather condition derived from the NWS shortForecast text.
- **Server_Script**: The PowerShell script (`start-server.ps1`) that starts an HTTP server on localhost:8080 serving the App.
- **Error_Message**: A human-readable message displayed to the User when an error occurs.

## Requirements

### Requirement 1: City Name Input

**User Story:** As a User, I want to type a U.S. city name into a text field and submit it, so that I can request a weather forecast for that city.

#### Acceptance Criteria

1. THE App SHALL display a text input field and a submit button on the main page.
2. WHEN the User submits the City_Input, THE App SHALL use the text entered in the City_Input field as the query value passed to Nominatim without modification.
3. IF the City_Input field is empty when the User submits, THEN THE App SHALL display an Error_Message indicating that a city name is required.
4. WHILE a weather request is in progress, THE App SHALL display a loading indicator to inform the User that data is being fetched.

---

### Requirement 2: Data Fetching

**User Story:** As a User, I want the App to automatically resolve my city name to coordinates and fetch a forecast from NWS, so that I receive accurate weather data without manual steps.

#### Acceptance Criteria

1. WHEN the User submits a non-empty City_Input, THE App SHALL send a request to Nominatim using the city name with `countrycodes=us` and extract the latitude and longitude from the first result.
2. IF Nominatim returns zero results, THEN THE App SHALL display an Error_Message stating that the city could not be found.
3. WHEN Coordinates are obtained, THE App SHALL request the NWS points endpoint (`https://api.weather.gov/points/{lat},{lon}`) and extract the Grid_Point (gridId, gridX, gridY) from the response.
4. WHEN a Grid_Point is obtained, THE App SHALL request the NWS daily forecast endpoint (`https://api.weather.gov/gridpoints/{gridId}/{gridX},{gridY}/forecast`) and extract the first 5 periods as the Forecast.
5. IF any API request fails due to a network error or error response, THEN THE App SHALL display a descriptive Error_Message identifying which step failed.

---

### Requirement 3: 5-Day Forecast Display

**User Story:** As a User, I want to see a 5-day forecast displayed as a table with weather icons, so that I can understand the upcoming weather at a glance.

#### Acceptance Criteria

1. WHEN a Forecast is successfully retrieved, THE App SHALL display the city name and render the Forecast_Table showing the first 5 daily periods.
2. THE Forecast_Table SHALL contain four columns: Day (period name from NWS), Icon (Weather_Icon emoji), Temperature (temperature value in °F), and Short Forecast (shortForecast text from NWS).
3. THE App SHALL map the NWS shortForecast text to a Weather_Icon emoji using these rules: Sunny or Clear → ☀️, Partly Cloudy or Mostly Sunny → ⛅, Cloudy or Overcast → ☁️, Rain or Showers → 🌧️, Thunderstorm → ⛈️, Snow → 🌨️, Fog or Haze → 🌫️, Windy → 💨, and all other conditions → 🌡️.
4. WHEN a new Forecast is successfully retrieved, THE App SHALL replace any previously displayed Forecast_Table or Error_Message with the new data.
5. THE App SHALL allow the User to perform a new search after an error without requiring a page reload.

---

### Requirement 4: Error Handling

**User Story:** As a User, I want to see a clear error message when something goes wrong, so that I understand what happened and can try again.

#### Acceptance Criteria

1. WHEN an error occurs at any stage, THE App SHALL display a single descriptive Error_Message in the UI.
2. WHEN an Error_Message is displayed, THE App SHALL clear any previously displayed Forecast_Table.
3. IF an error occurs, THEN THE App SHALL allow the User to submit a new City_Input without requiring a page reload.

---

### Requirement 5: Local HTTP Server

**User Story:** As a developer, I want a PowerShell script to start a local HTTP server, so that I can serve the App on localhost:8080 without installing additional software.

#### Acceptance Criteria

1. THE Server_Script SHALL start an HTTP listener on `localhost:8080`.
2. WHEN a browser requests the root path (`/`), THE Server_Script SHALL serve the `index.html` file with a `Content-Type` response header of `text/html`.
3. IF the Server_Script cannot bind to port 8080, THEN THE Server_Script SHALL display an Error_Message in the terminal indicating the port is unavailable.
