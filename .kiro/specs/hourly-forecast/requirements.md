# Requirements Document

## Introduction

This feature adds an hourly forecast view to the existing U.S. weather app. After a city's daily forecast is displayed, the user can also view the next 12 hours of weather data fetched from the NWS hourly forecast endpoint. The hourly data is displayed in a separate table on the same page, below the existing 5-period daily forecast. No frameworks, no caching, no classes — vanilla JS only, all inline in `index.html`.

## Glossary

- **App**: The single-page HTML/JavaScript weather application served on localhost:8080.
- **User**: The person interacting with the App in a web browser.
- **City_Input**: The text field in the App where the User types a U.S. city name.
- **NWS_API**: The National Weather Service API at `api.weather.gov`.
- **Grid_Point**: The NWS forecast grid identifier (gridId, gridX, gridY) already resolved by the existing daily forecast flow.
- **Hourly_Forecast**: The weather data returned by the NWS hourly forecast endpoint for a Grid_Point, covering individual one-hour periods.
- **Hourly_Table**: A table displaying the first 12 hourly periods from Hourly_Forecast with columns for Time, Icon, Temperature (°F), and Short Forecast.
- **Weather_Icon**: A Unicode emoji representing the weather condition derived from the NWS `shortForecast` text.
- **Toggle_Button**: A button that shows or hides the Hourly_Table after forecast data has been loaded.
- **Error_Message**: A human-readable message displayed to the User when an error occurs.

## Requirements

### Requirement 1: Hourly Forecast Fetch

**User Story:** As a User, I want the App to fetch hourly forecast data alongside the daily forecast, so that I can see how the weather changes hour by hour.

#### Acceptance Criteria

1. WHEN a Grid_Point is obtained, THE App SHALL request the NWS hourly forecast endpoint (`https://api.weather.gov/gridpoints/{gridId}/{gridX},{gridY}/forecast/hourly`) and extract up to the first 12 periods as the Hourly_Forecast; IF the response contains fewer than 12 periods, THE App SHALL use all available periods.
2. IF the hourly forecast API request fails due to a network error or non-OK HTTP response, THEN THE App SHALL display an Error_Message that includes the text "hourly forecast" and the HTTP status code or network error description; any previously displayed Hourly_Table SHALL remain visible until replaced or cleared.
3. WHEN a new city search is submitted, THE App SHALL immediately remove any previously displayed Hourly_Table before the new fetch begins, then display the newly fetched Hourly_Forecast data upon success.

---

### Requirement 2: Hourly Forecast Display

**User Story:** As a User, I want to see the next 12 hours of forecast data in a table, so that I can understand how conditions will change throughout the day.

#### Acceptance Criteria

1. WHEN a Grid_Point is available, THE App SHALL fetch the NWS hourly forecast endpoint (`https://api.weather.gov/gridpoints/{gridId}/{gridX},{gridY}/forecast/hourly`), extract up to the first 12 periods (Hourly_Forecast), and render the Hourly_Table below the daily Forecast_Table.
2. THE Hourly_Table SHALL contain four columns: Time (the `startTime` ISO 8601 field formatted as a 12-hour clock time, e.g., "2:00 PM"), Icon (Weather_Icon emoji), Temperature (temperature value in °F), and Short Forecast (shortForecast text from NWS).
3. THE App SHALL reuse the existing `getWeatherEmoji` function to derive the Weather_Icon for each hourly period from its `shortForecast` text.
4. WHEN the Hourly_Table is rendered, THE App SHALL display a section heading with the exact text "Hourly Forecast" above the Hourly_Table.
5. IF the hourly forecast fetch fails, THEN THE App SHALL NOT render an Hourly_Table and SHALL continue to display the daily Forecast_Table if it was already shown.

---

### Requirement 3: Show/Hide Toggle

**User Story:** As a User, I want to show or hide the hourly forecast table, so that I can keep the page uncluttered when I only need the daily summary.

#### Acceptance Criteria

1. WHEN Hourly_Forecast data is successfully retrieved, THE App SHALL display a Toggle_Button labeled "Show Hourly Forecast" below the daily Forecast_Table.
2. WHEN the User clicks the Toggle_Button and the Hourly_Table is hidden, THE App SHALL make the Hourly_Table visible and update the Toggle_Button label to "Hide Hourly Forecast".
3. WHEN the User clicks the Toggle_Button and the Hourly_Table is visible, THE App SHALL hide the Hourly_Table and update the Toggle_Button label to "Show Hourly Forecast".
4. WHEN a new city search is submitted, THE App SHALL immediately reset the Hourly_Table to the hidden state and reset the Toggle_Button label to "Show Hourly Forecast".
5. IF hourly forecast data is unavailable (fetch failed or returned no periods), THE App SHALL NOT display the Toggle_Button.

---

### Requirement 4: Time Formatting

**User Story:** As a User, I want hourly forecast times shown in a readable local format, so that I can easily understand when each forecast period applies.

#### Acceptance Criteria

1. WHEN rendering each hourly period, THE App SHALL parse the NWS `startTime` ISO 8601 string using the browser's `Date` constructor and format it into a string showing the abbreviated day of the week and 12-hour clock hour with AM/PM using the browser's locale (e.g., "Mon 3 PM"), derived via `toLocaleDateString` with `{ weekday: 'short' }` and `toLocaleTimeString` with `{ hour: 'numeric', hour12: true }` options.
2. THE App SHALL use the browser's built-in `Date` object to perform the time formatting — no external date libraries are permitted.
3. IF a period's `startTime` field is missing or cannot be parsed into a valid `Date`, THE App SHALL render the string "Unknown Time" in the Time column for that period.

---

### Requirement 5: Error Handling Integration

**User Story:** As a User, I want hourly forecast errors to appear consistently with daily forecast errors, so that I understand what went wrong without confusion.

#### Acceptance Criteria

1. IF the hourly forecast fetch fails, THEN THE App SHALL display an Error_Message in the same UI area used to display daily forecast errors.
2. IF the hourly forecast fetch fails, THEN THE App SHALL still display the Forecast_Table if the daily forecast data was successfully retrieved.
3. IF the hourly forecast fetch fails, THEN THE App SHALL NOT render an Hourly_Table (a table of hour-by-hour forecast periods).
