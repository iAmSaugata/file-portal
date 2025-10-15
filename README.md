# File Management Portal (v6)
- No horizontal scroll (overflow-x hidden).
- Darker high-contrast header; larger File Management label; Sign Out on right.
- Upload page: no Back, Done goes to /dashboard; Cancel disabled unless active; uploads auto-start when files added.
- Duplicate prevention: remembers finished files by **name** and **SHA-256** (client-side worker).
- Dashboard: search by name/comments; comments column removed (📜 icon on same line); full file name with highlighted ellipsis after 25 chars (tooltip shows full); date moved below name; buttons fixed; toasts for actions.
