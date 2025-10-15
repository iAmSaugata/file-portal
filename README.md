# File Management Portal — v8

## What’s new
- **Header** darker & larger for stronger contrast.
- **Login**: Clear & Login aligned to the **right**.
- **Dashboard**
  - Search moved to the **right above** File Upload; button is **Clear**.
  - Buttons fixed with **event delegation**; centered in the column.
  - File name truncation at **60** chars with colored `…` and full tooltip.
  - **Delete** uses a **modal** (shows filename).
  - **Remove Selected** uses a **modal** listing all filenames and deletes **one-by-one**, showing per-file toast: “_Filename_ Delete Successfully”.
  - Toasts stay **longer**.
  - **GetLink** toast: “Download Link Copied for _Filename_”.
- **Upload page**
  - Instant uploads; Cancel disabled unless active.
  - Duplicate prevention by **name** and **SHA‑256** content hash (worker).
  - **Copy Link** toast includes the filename.
- **General**
  - No text-selection cursor (except in inputs), no overscroll-bounce.
  - Added a **favicon** (cloud upload icon).

## Run
```bash
unzip file-portal-v8.zip
cd file-portal-v8
docker compose up -d --build
# open http://<host>:9876
```

> Set `AUTH_BCRYPT_HASH` to enable the password screen.
