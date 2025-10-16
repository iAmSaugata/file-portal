# File Management Portal — v10.2

Changes
- **Download page**: "Copy Link" → **Share** (Web Share API). Falls back to copy if not supported.
- **Buttons in one row**: **Download**, **Share**, **Close**.
- **Close**: closes window; if blocked, goes back or navigates to `/`.
- **Two code boxes**: **Windows** (PowerShell `Invoke-WebRequest`) and **Linux** (`wget`), each with **Copy** button.

Other features retained from v10/v10.1:
- Dashboard GetLink opens the **download page** (`/d/:token`).
- Parallel uploads (client-side), cancel/disable Done during active upload.
- File size formatting (MB if > 500 KB else KB).
- Cloudflare IP logging and `trust proxy` handling.
- Link TTL via `LINK_TTL_MS` (default 24h).

## Env
```
SESSION_SECRET=change-me-please
AUTH_BCRYPT_HASH=
MAX_UPLOAD_MB=200
BASE_URL=
BRAND_TITLE=File Management
BRAND_LOGO_URL=
BRAND_PRIMARY_COLOR=
FOOTER_TEXT=Powered by ChatGPT • © iAmSaugata
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200
DOWNLOAD_RATE_LIMIT_MAX=60
LINK_TTL_MS=86400000
TRUST_PROXY=1
UPLOAD_CONCURRENCY=3
```

## Run
```bash
unzip file-portal-v10.2.zip
cd file-portal-v10.2
docker compose up -d --build
```
