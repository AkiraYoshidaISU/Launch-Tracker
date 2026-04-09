# Launch Monitoring Station

This is a worldwide upcoming rocket launch dashboard designed for GitHub Pages.

## Features
- Browser-safe data loading from `data/upcoming-launches.json` (no client-side CORS dependency)
- Display fields: mission name / rocket type / launch site / date and time
- Live countdown to the next launch (updates every second)
- Responsive layout (desktop and mobile)
- Automatic refresh every 5 minutes
- Scheduled data refresh every 30 minutes via GitHub Actions

## File Structure
- `index.html`: Main dashboard page
- `styles.css`: Visual styling (monitoring-station themed UI)
- `app.js`: Dashboard rendering and countdown logic
- `scripts/fetch-launches.mjs`: Server-side launch fetch script for Actions
- `data/upcoming-launches.json`: Cached launch dataset served by GitHub Pages
- `.github/workflows/deploy-pages.yml`: GitHub Pages auto-deployment workflow
- `.github/workflows/update-launch-data.yml`: Scheduled launch data refresh workflow

## Publishing Steps (GitHub Pages)
1. Push this folder to a GitHub repository
2. Open `Settings > Pages` in GitHub
3. Set `Build and deployment` to `GitHub Actions`
4. Push to the `main` branch to trigger deployment

Published URL format: `https://<your-user>.github.io/<repo-name>/`

## Notes
- Data source: `https://ll.thespacedevs.com`
- If `data/upcoming-launches.json` is missing or stale, run `Update Launch Data` workflow manually once.
