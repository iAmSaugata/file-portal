# File Management Portal (v8)
- Fixes: right-aligned **File Upload** (controls alignment), working **Browse**, **Drag & Drop**, and **Done** (Done is a normal link).
- Robust upload script wrapped safely; hashing worker per file to avoid race; DnD supports click-to-open on dropzone.
- All buttons wired; toasts for actions; CSP allows 'unsafe-inline' + blob:.
