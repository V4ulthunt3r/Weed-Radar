# Data directory

- **manifest.json** — Template for the offline database manifest. Replace all `DUMMY` placeholders before use:
  - `version`: string (recommended: `YYYY-MM-DD` or `YYYY-MM-DD-XX`)
  - `createdAt`: ISO8601 UTC
  - `sizeBytes`, `sha256`: required; validated by the app
  - `url`: GitHub Release asset URL for `weedradar.sqlite.zst`

- **index.html** — Attribution page (ODbL / OpenStreetMap).
