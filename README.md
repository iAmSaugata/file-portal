# File Management Portal — v8

- Login: only **Clear** and **Logon** buttons aligned right; no Reload button.
- Dashboard: search on right above *File Upload*, **modal** confirmation for *Delete* and *Remove Selected* (with filename list),
  toasts per file ("Filename Delete Successfully") with longer lifetime, buttons centered and delegated for reliability.
- GetLink & Copy Link show toasts: "Download Link Copied for <Filename>".
- No text cursor/selection on general UI; inputs still selectable. No overscroll "bounce".
- Added a simple **favicon** (SVG).

Deploy:
```bash
unzip file-portal-v8.zip
cd file-portal-v8
docker compose up -d --build
# http://<host>:9876
```
