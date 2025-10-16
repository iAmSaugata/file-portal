# File Management Portal — v10

Includes everything from v9 plus:
- File size on dashboard: **MB if > 500KB**, otherwise in KB.
- **Parallel uploads** with env var **UPLOAD_CONCURRENCY** (default 3).
- **Done** button is disabled while uploads are active; re-enabled when all complete/canceled.
- **Cancel** aborts *all* in-flight uploads and clears the queue.
- Express **trust proxy** + Morgan override to log **Cloudflare client IP** (`CF-Connecting-IP`).

## Env
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
TRUST_PROXY=1            # Cloudflare only; increase if you add more proxies
UPLOAD_CONCURRENCY=3     # number of parallel uploads on the client
```

## Run
```bash
unzip file-portal-v10.zip
cd file-portal-v10
docker compose up -d --build
# open http://<host>:9876
```
