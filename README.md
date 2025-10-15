# File Management Portal

A self-hosted, secure, modern file upload and management portal with Docker packaging and a clean UI.

## Features
- Password-only login (optional) using bcrypt hash (stored only as hash)
- Centered, modern, mobile-friendly UI with subtle gradient, 3D buttons, hover effects
- File list with search filter, comments, size, date, and actions (GetLink / Delete)
- Bulk Delete with disabled-by-default red button (enabled only when items selected)
- Dedicated upload page with drag-and-drop, browse, live progress, and post-upload share/copy helpers
- Share sheet support (`navigator.share`) when available
- Encoded (token-based) download links; download page provides direct link + wget copy snippet
- SQLite-backed metadata and link storage
- Dockerized for single-command deployment

## Quick Start

1. Generate a bcrypt hash for your chosen password (replace `YOUR_PASSWORD`):

```bash
docker run ghcr.io/wg-easy/wg-easy:14 node -e 'const bcrypt = require("bcryptjs"); const hash = bcrypt.hashSync("YOUR_PASSWORD", 10); console.log(hash.replace(/\$/g, "$$$$"));'
```

2. Create a `.env` (optional) in the project root to set environment variables:

```
AUTH_BCRYPT_HASH=<paste-your-bcrypt-hash-here>
SESSION_SECRET=change-me-please
MAX_UPLOAD_MB=200
BASE_URL=https://files.example.com
```

> If `AUTH_BCRYPT_HASH` is **unset/empty**, the portal will not require login.

3. Build & run with Docker Compose:

```bash
docker compose up -d --build
```

4. Open: `http://<host>:9876`

## Volumes
- `./data/uploads` → uploaded files
- `./data/sqlite/portal.db` → SQLite database

## Notes
- The login page has no header and contains a centered card titled **Login** with **Clear**, **Reload**, and **Login** buttons (equal size).
- Disabled elements are clearly styled (grayed) and show “(disabled)” suffix.
- Footer text on all screens: **Powered by Cloudflare DNS API • © iAmSaugata** (bold).

## Security
- Helmet for security headers
- Rate limiting on login
- Signed cookie session
- Tokenized download links (no direct file paths)


## Branding & Limits
Environment variables:

```
BRAND_TITLE="My Files"
BRAND_LOGO_URL="https://example.com/logo.png"
BRAND_PRIMARY_COLOR="#4f46e5"
FOOTER_TEXT="Powered by ChatGPT • © iAmSaugata"

# Rate limits
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200
DOWNLOAD_RATE_LIMIT_MAX=60

# Link expiry (default 24h)
LINK_TTL_MS=86400000
```
