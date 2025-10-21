# File Management Portal (Docker, Self‑Hosted)

Modern, secure, and **Docker‑deployable** file upload & management web portal with a clean, responsive UI.  
Built for reverse proxies (Cloudflare), supports tokenized download links, parallel uploads, client‑side SHA‑256 duplicate prevention, and admin‑only dashboard with bcrypt authentication.

---

## ✨ Features

- Supports Docker-first deployment (single `docker compose up -d --build`).
- Supports optional password authentication (single bcrypt-protected password).
- Supports signed cookies (`httpOnly`, `sameSite=lax`) for session persistence.
- Supports Cloudflare/proxy awareness via Express `trust proxy`.
- Supports rate limiting for API and download endpoints (configurable caps).
- Supports configurable per-request file-count limits to guard disk usage.
- Supports configurable public origin override with `BASE_URL`.
- Supports drag-and-drop file uploads.
- Supports traditional “Browse” file selection.
- Supports immediate, auto-start uploads (no extra Upload button).
- Supports live per-file progress bars and real-time upload speed.
- Supports parallel uploads with configurable concurrency (`UPLOAD_CONCURRENCY`).
- Supports canceling active uploads; disables “Done” while uploading.
- Supports duplicate-prevention by file **name** (session memory).
- Supports duplicate-prevention by **content** using client-side SHA-256 (Web Worker).
- Supports optional per-upload comments.
- Supports searching files by **name** or **comments**.
- Supports long file names with tooltip (colored ellipsis beyond 60 chars).
- Supports comments indicator (📜) beside file name with tooltip.
- Supports date display under the file name (no separate Date column).
- Supports file size formatting (MB if > 500 KB, else KB).
- Supports bulk selection with **Remove Selected** (modal confirmation).
- Supports per-file **Delete** (modal confirmation).
- Supports **GetLink** to generate tokenized download links.
- Supports opening a **download page** (`/d/:token`) for each link.
- Supports **Copy** (direct link), **Share** (system share), and **Close** (red) on download page.
- Supports Code blocks with **Copy** for Windows & Linux commands for download.
- Supports direct download endpoint `/dl/:token` (encoded, not raw path; TTL-gated).
- Supports customizable header (bold “File Management”).
- Supports modern theming: light background, gradient panels, 3D buttons, hover effects.
- Supports footer branding text (e.g., **Powered by ChatGPT • © iAmSaugata**).
- Supports persistent storage: files on disk (`/uploads`), metadata in SQLite (WAL).
- Supports structured logging with morgan (prefers `cf-connecting-ip`, shows `cf-ray` & country).
- Supports environment-based configuration (port, secrets, limits, branding, TTLs).

---

## 🧩 Environment Variables

| Name | Default | Description |
|---|---|---|
| `PORT` | `8080` | Container port the server binds to. |
| `SESSION_SECRET` | _(required)_ | Cookie signing secret (at least 32 characters). |
| `COOKIE_SECURE` | `auto` | Force session cookie `secure` flag (`true` by default when `NODE_ENV=production`). |
| `AUTH_BCRYPT_HASH` | _(empty)_ | Bcrypt hash of your admin password (see **Hash Generation**). If empty, login is disabled. |
| `MAX_UPLOAD_MB` | `200` | Per-file upload size cap. |
| `MAX_FILES_PER_UPLOAD` | `10` | Maximum number of files accepted per upload request. |
| `BASE_URL` | _(auto from request)_ | Public base URL (e.g., `https://files.example.com`). Needed behind proxies so links point to the correct origin. |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (ms). |
| `RATE_LIMIT_MAX` | `200` | Max requests per window for `/api/*`. |
| `DOWNLOAD_RATE_LIMIT_MAX` | `60` | Max requests per window for `/dl/*`. |
| `LINK_TTL_MS` | `86400000` | Link expiry (ms). |
| `TRUST_PROXY` | `1` | Express `trust proxy` (set to `1` for Cloudflare). |
| `UPLOAD_CONCURRENCY` | `3` | Number of parallel uploads on client. |

> **File size display rule**: **MB** if > **500 KB**, else **KB**.

> `COOKIE_SECURE` automatically becomes `true` when `NODE_ENV=production`. Set `COOKIE_SECURE=false` for plain HTTP development environments.

---

## 🔒 Security Notes

- **Auth:** One bcrypt-protected password; keep the hash secret and rotate periodically.
- **Cookies:** Signed, `httpOnly`, `sameSite=lax`, and `secure` when `COOKIE_SECURE=true` (or automatically when `NODE_ENV=production`).
- **CSP:** Helmet with conservative defaults + allowances for inline `style`/`script` where needed, and `worker-src blob:`.
- SESSION_SECRET
  - **What:** A long, random secret used to **sign session cookies** so they can't be tampered with.
  - **Why:** Required for secure logins; without it, cookies aren’t trusted.
  - **How long:** At least 32 bytes (≈ 64 hex chars) is recommended.
  - **Required:** The server refuses to start without a strong value.

---

## 🔐 Hash Generation (bcrypt)

Use this **Docker-only** command to generate a bcrypt hash for your password (no Node project needed):
```bash
docker run --rm -e PASS='YOUR-PASSWORD-HERE' -e COST=10 node:20-alpine sh -lc '
  npm -g i bcryptjs >/dev/null 2>&1 &&
  export NODE_PATH=$(npm root -g) &&
  node -e "require(\"module\").Module._initPaths();const b=require(\"bcryptjs\");const h=b.hashSync(process.env.PASS,Number(process.env.COST)||10);console.log(h)"
'
```

- Put the output into `AUTH_BCRYPT_HASH`.
- **docker-compose interpolation tip**: `$` must be escaped as `$$` in YAML. Example:
  ```yaml
  AUTH_BCRYPT_HASH: "$$2a$$10$$1GQDDcqXtI7DmiPjJSUgXeLXDSNovtlKA6OMSppfU.lbfVODVmopC"
  ```

---

## 🔑 Generate SESSION_SECRET (Docker)

Use this **Docker-only** command to generate SESSION_SECRET
```bash
docker run --rm node:20-alpine node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"\
```

- Put the output into `SESSION_SECRET`.
- **docker-compose interpolation tip**: `$` must be escaped as `$$` in YAML. Example:
  ```yaml
  SESSION_SECRET: "280737c2a36f0fe5d774497618c0e8664783c1d2155b6b24a712361c984970d8"
  ```

---

## 🚀 Quick Start (Docker Compose)

```yaml
version: "3.8"
services:
  file-portal:
    build: ./server
    container_name: file-portal
    environment:
      PORT: 8080
      SESSION_SECRET: "${SESSION_SECRET:?set a strong secret}"  # must be >= 32 chars
      AUTH_BCRYPT_HASH: "$$2a$$10$$1GQDDcqXtI7DmiPjJSUgXeLXDSNovtlKA6OMSppfU.lbfVODVmopC"
      MAX_UPLOAD_MB: 100
      MAX_FILES_PER_UPLOAD: 10
      BASE_URL: "https://files.example.com"
      BRAND_TITLE: "File Management"
      FOOTER_TEXT: "Powered by Cloudflare DNS API • © iAmSaugata"
      RATE_LIMIT_WINDOW_MS: 900000
      RATE_LIMIT_MAX: 200
      DOWNLOAD_RATE_LIMIT_MAX: 60
      LINK_TTL_MS: 86400000   # 24 hours
      TRUST_PROXY: 1          # Cloudflare / any reverse proxy
      UPLOAD_CONCURRENCY: 3
      COOKIE_SECURE: "true"  # enable when TLS is terminated before the container
    volumes:
      - ./data/uploads:/app/uploads
      - ./data/sqlite:/app/sqlite
    ports:
      - "9876:8080"
    restart: unless-stopped
```

```bash
docker compose up -d --build
```

> **Cloudflare**: Set `TRUST_PROXY=1` to allow Express & rate limiters to use `cf-connecting-ip` as the real client IP. Logs include cf-ray & country.

---

## 🧭 Usage & ScreenShots
Logon
<img width="975" height="716" alt="image" src="https://github.com/user-attachments/assets/82371212-e4ab-4e9c-821e-399fdfa815d2" />

File Management
<img width="975" height="572" alt="image" src="https://github.com/user-attachments/assets/04e41099-48a5-4a03-b355-2940b836f7f9" />

Download Link
<img width="975" height="688" alt="image" src="https://github.com/user-attachments/assets/e48c1ae9-456c-41b4-bd6b-b0e726146ea5" />

File Upload
<img width="975" height="825" alt="image" src="https://github.com/user-attachments/assets/b1c10099-db82-4942-85e3-148f2a928c2c" />

<img width="975" height="1020" alt="image" src="https://github.com/user-attachments/assets/b4ac2697-acb3-4708-a620-30db23757f23" />

---

## 🔧 Behavior Details

- **Duplicate prevention** (client):
  - By **name** (session memory)
  - By **content hash** (SHA‑256 via Web Worker)
- **Toasts**: Info (blue), Success (green), Error (red)

---

## 🧱 Reverse Proxy / Cloudflare Notes

- **trust proxy** is enabled (configurable by `TRUST_PROXY`) so `req.ip` and the rate limiter use the forwarded client IP correctly.
- Logging uses `cf-connecting-ip`, `cf-ray`, and `cf-ipcountry` when available.
- If you see:
  > `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR … trust proxy is false`  
  set `TRUST_PROXY=1` (or appropriate hop count) and redeploy.

---

## 🗃️ Data & Volumes

- **Uploads:** `./data/uploads` (bind‑mount to `/app/uploads`)
- **DB:** `./data/sqlite/portal.db` (bind‑mount to `/app/sqlite`)

Back up both for disaster recovery.

---

## 🆘 Troubleshooting

- **Upload too large** → increase `MAX_UPLOAD_MB` (MB per file).
- **“Done” unresponsive during upload** → by design; disabled while any task active. Cancels are supported.
- **Windows command shows `\\`** → fixed via template literal in `download.ejs` (avoid `JSON.stringify('.\\')`).
- **All requests from internal IP** → set `TRUST_PROXY=1` under Cloudflare; logs will show real IP from `cf-connecting-ip`.
- **Slow link or rate limit** → adjust `RATE_LIMIT_*` values to suit your traffic.

---

## 🗓️ Link Expiry

- `/dl/:token` links expire after `LINK_TTL_MS` (default 24h).  
- Tokens are random NanoID; file paths aren’t exposed.

---

## 📜 License

Copyright © iAmSaugata. 
