# File Management Portal — v9

Changes in this build:
- Upload page **Done** button is explicitly bound to return to **/dashboard**.
- Search field + **Clear** are on the **right** above **File Upload**.
- Improved **favicon** (folder + cloud upload mark).
- All v8 features retained: modals for delete, toasts per filename, centered action buttons, search by name/comments, etc.

Deploy:
```bash
unzip file-portal-v9.zip
cd file-portal-v9
docker compose up -d --build
# http://<host>:9876
```
