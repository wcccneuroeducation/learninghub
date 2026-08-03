# NeuroQuest Content Studio v1

## Easiest way to open it on Windows

1. Extract the ZIP.
2. Double-click `START_STUDIO.bat`.
3. Keep the black command window open while using the Studio.

The Studio opens automatically in your browser.

If Python is not installed, open this folder in VS Code, right-click `index.html`, and choose **Open with Live Server**.

Do not open `index.html` directly from File Explorer. Browser security blocks JavaScript modules on `file:///` pages.

## Included editors

- 4-option MCQ
- True / False
- Matching
- Polygon Hotspot

## Architecture

- `index.html` — permanent shell
- `studio.css` — shared styling
- `studio.js` — single entry point
- `core/` — registry, state and shared app logic
- `editors/` — pluggable interaction editors
- `config/` — topics, destinations, categories and difficulty settings

## Adding a future editor

Create a new file under `editors/`, register it with `registerEditor({...})`, then add one import to `studio.js`. The main page does not need redesigning.
