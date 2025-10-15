# File Management Portal — v7

Fixes & Tweaks:
- Download page has a **Done** button -> dashboard (refreshes list).
- Dashboard actions wired via **event delegation**: *Remove Selected*, *GetLink*, *Delete* work reliably.
- Search button renamed to **Clear** and clears input.
- Filename truncation threshold raised to **60** chars; colored ellipsis + tooltip for full name.
- Action buttons centered; darker header bar with bigger title.

Deploy:
```bash
unzip file-portal-v7.zip
cd file-portal-v7
docker compose up -d --build
# http://<host>:9876
```
