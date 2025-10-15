# File Management Portal — v6

- No horizontal scroll; darker header bar with bold title + Sign Out.
- Upload: instant start (drag/drop or browse), cancel only when active, Done => dashboard.
- Duplicate prevention: skips by **name** and by **SHA‑256** content hash (worker).
- Dashboard: search by **name or comments**, comments column removed; date shown below name; 📜 tooltip icon when comments exist.
- Filename shows fully; beyond 25 chars shows highlighted ellipsis + tooltip.
- Toasters: blue (info), green (copied), red (delete/fail).
- Dockerized; bcrypt password login optional; 24h link expiry & rate limits.
