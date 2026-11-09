---
inclusion: always
---

# Project Structure

```
environment/
├── weather-app/
│   ├── index.html          # Entire app: HTML, inline CSS, inline JavaScript
│   └── start-server.ps1    # PowerShell HTTP server on localhost:8080
└── .kiro/
    ├── steering/           # AI steering rules (always included)
    └── specs/
        └── weather-app/    # Spec documents for the weather app feature
```

## Conventions

- All application code lives in `weather-app/index.html` — a single file containing HTML structure, `<style>` block, and `<script>` block.
- The PowerShell server script uses `$PSScriptRoot` to resolve `index.html`, so it works from any working directory.
- If path issues arise when starting the server, create a `.bat` batch script as a launcher alternative.
- No subdirectories or additional source files are expected under `weather-app/`.
