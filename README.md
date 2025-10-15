# Self-Hosted File Upload & Management Portal

A lightweight Node.js + SQLite portal to upload, manage, and share files with expiring links.

## Features
- Dockerized (Dockerfile + docker-compose.yml)
- Login (optional): set `AUTH_BCRYPT_HASH` to enable password auth.
- Dashboard: search by name/comments, copy link, bulk delete, toasts, inline date.
- Uploads: drag/drop or browse (multi), auto-start, progress, live speed, duplicate prevention
  - Session duplicate prevention by **name** and **SHA-256** (client-side Web Worker)
- API: `/api/upload`, `/api/getlink`, `/api/delete`
- Download:
  - `/d/:token` (page + wget command)
  - `/dl/:token` (direct, rate-limited)
- Security: Helmet CSP (allows `unsafe-inline` + `blob:` for worker), rate limits
- SQLite schema:
  - `files(id, stored_name, original_name, size, comments, uploaded_at)`
  - `links(id, file_id, token, created_at)`

## Quick Start (without Docker)
```bash
cp .env.example .env  # edit as needed
npm install --omit=dev
node server.js
# open http://localhost:8080/login (if AUTH_BCRYPT_HASH set) or /dashboard
```

## Docker
```bash
docker compose up -d --build
# open http://localhost:8080
```

## Env Vars
See `.env.example`. Notable:
- `AUTH_BCRYPT_HASH`: if set, login is enforced. Generate with:
  docker run ghcr.io/wg-easy/wg-easy:14 node -e 'const bcrypt=require("bcryptjs"); const h=bcrypt.hashSync("YOUR_PASSWORD",10); console.log(h.replace(/\$/g,"$$$$"));'
- `BASE_URL`: public base URL for link generation (e.g., `https://files.example.com`). If blank, falls back to request host.
