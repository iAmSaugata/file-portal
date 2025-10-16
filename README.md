# File Management Portal — v10.1

This version builds on v10 and adds:
- **Parallel uploads** controlled by `PARALLEL_UPLOADS` env (default 2).
- **Done** button is disabled while any upload is in progress and re-enabled when all finish.

All other behavior remains unchanged from v10.

## Deploy
```bash
unzip file-portal-v10.1.zip
cd file-portal-v10.1
docker compose up -d --build
```

## Environment
- `PARALLEL_UPLOADS` — integer, max number of concurrent uploads (default 2).
- Other envs are identical to v10.
