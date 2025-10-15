# File Management Portal — v8

What's new
- **Upload page**: Done button fixed (explicit JS handler).
- **Modals**: Pretty confirm dialogs for *Delete* and *Delete Selected* (with list of names).
- **Toasts**: Last a bit longer and include details (e.g., “Download link copied”, “<file> deleted successfully”). Bulk delete shows one toast **per file**.
- **Header**: Darker shade, larger text for higher contrast.
- **Search**: right-aligned cluster; “Clear” button clears value.
- **Login**: Reload button removed (Clear + Login only).

Deploy
```bash
unzip file-portal-v8.zip
cd file-portal-v8
docker compose up -d --build
# open http://<host>:9876
```
