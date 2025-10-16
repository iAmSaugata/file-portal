# File Management Portal — v10.1

Adds **parallel uploads** (configurable) and disables the **Done** button while any upload is in progress.

## What's new vs v10
- **Parallel uploads** with `UPLOAD_CONCURRENCY` (default 3).
- **Done** button disabled during active uploads to prevent navigating back mid-transfer.
- No other visual or functional changes to the Upload page.

## Env
- `UPLOAD_CONCURRENCY=3`  # number of files to upload in parallel

## Deploy
```bash
unzip file-portal-v10.1.zip
cd file-portal-v10.1
docker compose up -d --build
```
