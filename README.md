# File Management Portal — v10.1

Adds **parallel uploads** and **Done lock** during active uploads.
- Configure concurrency via `PARALLEL_UPLOADS` (default **2**).
- While any upload is in progress, the **Done** button is **disabled** and re-enabled when all complete or canceled.

No other upload page UI/style changes were made.

## Deploy
```bash
unzip file-portal-v10.1.zip
cd file-portal-v10_1
docker compose up -d --build
```
