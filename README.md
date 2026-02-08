# Vantage — Never-Ending Task Manager

A Chrome extension built for businesses where the work **never stops**. Complete a task, and 1–3 new tasks spawn in its place. Stay productive. Stay relentless.

## Features

- **Never-Ending Tasks** — Every completed task spawns 1–3 follow-up tasks. The backlog is infinite.
- **8 Business Categories** — Marketing, Sales, Operations, HR, Finance, Product, Engineering, Support
- **Smart Task Generation** — Over 100 task templates with dynamic placeholders (company names, dates, tools, etc.)
- **Priority System** — Critical, High, Medium, Low priorities with visual indicators
- **Filtering & Sorting** — Filter by category, sort by priority/due date/category
- **Stats Dashboard** — Track completions, streaks, spawned tasks, and per-category breakdowns
- **Custom Tasks** — Add your own tasks alongside generated ones
- **Spawn Animations** — Satisfying visual feedback when tasks complete and new ones appear
- **Progress Bar** — A progress bar that *never reaches 100%* (because the work never ends)

## Installation

1. **Generate Icons**: Open `generate-icons.html` in Chrome, right-click each canvas, and save the images to the `icons/` folder as `icon16.png`, `icon48.png`, and `icon128.png`.
2. Open `chrome://extensions/` in Chrome.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked**.
5. Select the `Vantage Google Extension` folder.
6. Click the Vantage icon in your toolbar — the tasks are waiting.

## File Structure

```
Vantage Google Extension/
├── manifest.json        # Chrome Extension manifest (v3)
├── popup.html           # Popup UI layout
├── popup.css            # Styling — dark theme, animations
├── popup.js             # Main controller — rendering, events, state
├── taskEngine.js        # Task generation engine — templates, spawning logic
├── storage.js           # Chrome storage abstraction layer
├── icons/               # Extension icons (16, 48, 128px)
├── generate-icons.html  # Icon generation utility
└── README.md            # This file
```

## How It Works

1. On first launch, **8–12 starter tasks** are generated across all business categories.
2. Click the **checkbox** on any task to complete it.
3. **1–3 new tasks** immediately spawn (60% chance same category, 40% random).
4. Your stats update: completions, spawns, daily count, streak.
5. The progress bar fills but **never reaches 100%** — because there's always more.
6. Repeat forever.

## Tech Stack

- **Chrome Extension Manifest V3**
- **Vanilla JS** — no frameworks, no dependencies
- **Chrome Storage API** — persistent local data
- **CSS Custom Properties** — themeable design tokens
- **CSS Animations** — smooth task transitions and spawn effects
