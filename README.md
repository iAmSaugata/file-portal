# File Management Portal (v9)

**Fixes**
- Drag & Drop now handled **globally**: dropping files anywhere on the page is captured and fed into the queue (with default prevented), so the browser never navigates away.
- Dropzone is also **clickable** (opens the file picker).
- **Browse** works even without JS (via `<label for="picker">`), and also with JS.
- **Done** links to `/dashboard?r=TIMESTAMP` and the dashboard route is `Cache-Control: no-store` so it always reloads the latest list.

Other features from earlier versions remain (auto uploads, SHA‑256 dedupe, toasts, etc.).
