# File Management Portal — v10.1

What's new vs v10
- **GetLink** (dashboard) now opens the **download page** (`/d/:token`) that renders `server/views/download.ejs`.
- All v10 features retained: parallel uploads, longer toasts, Cloudflare IP logging, etc.

## Env (same as before)
```
SESSION_SECRET=change-me-please
AUTH_BCRYPT_HASH= # bcrypt hash of your password
MAX_UPLOAD_MB=200
BASE_URL= # e.g. https://files.example.com
BRAND_TITLE=File Management
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
unzip file-portal-v10.1.zip
cd file-portal-v10.1
docker compose up -d --build
```
