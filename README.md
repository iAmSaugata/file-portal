# File Management Portal (v7)
- Login first when `AUTH_BCRYPT_HASH` is set; otherwise go straight to dashboard.
- Login: centered card, title “Login”, password field, **Clear / Login** buttons; success sets signed cookie + `localStorage` then redirects; failures show inline error; login is rate-limited.
- Background #6F8FF0; header outside card (dark translucent), bold/large “File Management”, Sign Out right.
- Dashboard: top-right compact Search (name or comments); **Remove Selected** + **File Upload** controls; table columns `Select | File | Size | Action`; comments column removed; 📜 tooltip next to name when comments exist; date under name; full names with highlighted ellipsis after 30 chars.
- Upload page: drag/drop + Browse; uploads auto-start; cancel disabled unless active; Copy Link after each file; session duplicate prevention by **name** and **SHA‑256** worker; Done goes to `/dashboard`.
- API: `/api/upload`, `/api/getlink`, `/api/delete`; tokens in SQLite; download rate-limited; links expire by `LINK_TTL_MS` (24h default).
