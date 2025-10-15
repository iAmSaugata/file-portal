# File Management Portal

A self-hosted, secure, modern file upload & management portal — Dockerized.

## Highlights
- Password login (bcrypt hash; optional).
- Centered, modern UI with gradient panels & 3D buttons.
- File list: search, comments, size, date, actions (GetLink / Delete).
- **Bulk Remove** button (red, disabled until selection).
- **New upload UI**: drag/drop queue, starts on **Upload**, per-file progress **and speed**, and **Copy Link** after each file finishes.
- Tokenized links with 24h expiry by default.
- API and download **rate limiting**.
- Branding via env (title/logo/primary color).

## Quick run
1) (Optional) Generate bcrypt hash:
```bash
docker run ghcr.io/wg-easy/wg-easy:14 node -e 'const bcrypt=require("bcryptjs"); const h=bcrypt.hashSync("YOUR_PASSWORD",10); console.log(h.replace(/\$/g,"$$$$"));'
```
2) Edit `.env` (provided) and set values.
3) Start:
```bash
docker compose up -d --build
```
Open: `http://<host>:9876`

## Env (excerpt)
```
AUTH_BCRYPT_HASH=
SESSION_SECRET=change-me-please
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
```
