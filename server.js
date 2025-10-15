import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mime from 'mime-types';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Respect X-Forwarded-* headers when behind proxies / Docker / reverse proxies
app.set('trust proxy', true);

// ---- Config ----
const PORT = process.env.PORT || 8080;
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-me-please';
const AUTH_BCRYPT_HASH = process.env.AUTH_BCRYPT_HASH || '';
const MAX_UPLOAD_MB = parseInt(process.env.MAX_UPLOAD_MB || '200', 10);
const BASE_URL = (process.env.BASE_URL || '').trim();
const BRAND_TITLE = process.env.BRAND_TITLE || 'File Management';
const BRAND_LOGO_URL = process.env.BRAND_LOGO_URL || '';
const BRAND_PRIMARY_COLOR = process.env.BRAND_PRIMARY_COLOR || '';
const FOOTER_TEXT = process.env.FOOTER_TEXT || 'Powered by ChatGPT © iAmSaugata';
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '200', 10);
const DOWNLOAD_RATE_LIMIT_MAX = parseInt(process.env.DOWNLOAD_RATE_LIMIT_MAX || '60', 10);
const LINK_TTL_MS = parseInt(process.env.LINK_TTL_MS || '86400000', 10);

const uploadsDir = path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

// ---- Security Headers (Helmet + CSP) ----
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'","blob:"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "img-src": ["'self'", "data:"],
      "worker-src": ["'self'", "blob:"],
      "connect-src": ["'self'"]
    }
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(SESSION_SECRET));

// ---- Rate limiting ----
const generalLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(generalLimiter);

const downloadLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: DOWNLOAD_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false
});

// ---- Auth helpers ----
function requireAuth(req, res, next) {
  if (!AUTH_BCRYPT_HASH) return next(); // auth disabled
  const authed = req.signedCookies && req.signedCookies.auth === '1';
  if (authed) return next();
  return res.redirect('/login');
}

function publicBaseUrl(req) {
  if (BASE_URL) return BASE_URL.replace(/\/+$/,'');
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

// ---- Multer ----
const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 }
});

// ---- Static ----
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', requireAuth, express.static(uploadsDir)); // not directly linked, but helpful in dev

// ---- Routes (Pages) ----
app.get('/', (req,res)=> res.redirect(AUTH_BCRYPT_HASH ? '/login' : '/dashboard'));
app.get('/login', (req,res)=>{
  if (!AUTH_BCRYPT_HASH) return res.redirect('/dashboard');
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.post('/login', express.urlencoded({extended:true}), (req,res)=>{
  if (!AUTH_BCRYPT_HASH) return res.status(400).send('Auth disabled');
  const pass = (req.body.password || '').toString();
  const ok = bcrypt.compareSync(pass, AUTH_BCRYPT_HASH);
  if (!ok) return res.status(401).send('Invalid password');
  res.cookie('auth', '1', { signed: true, httpOnly: true, sameSite: 'lax' });
  return res.json({ ok: true });
});
app.post('/logout', (req,res)=>{
  res.clearCookie('auth');
  return res.json({ ok: true });
});

app.get('/dashboard', requireAuth, (req,res)=>{
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/upload', requireAuth, (req,res)=>{
  res.sendFile(path.join(__dirname, 'public', 'upload.html'));
});

// ---- API ----
app.get('/api/files', requireAuth, (req,res)=>{
  const rows = db.prepare(`
    SELECT id, stored_name, original_name, size, comments, uploaded_at
    FROM files ORDER BY id DESC
  `).all();
  res.json({ ok:true, files: rows });
});

app.post('/api/upload', requireAuth, upload.array('files'), (req,res)=>{
  const comments = (req.body.comments || '').toString();
  const saved = [];
  const now = Date.now();

  for (const f of req.files) {
    const storedName = f.filename;
    const originalName = f.originalname;
    const size = f.size;

    const info = db.prepare(`
      INSERT INTO files (stored_name, original_name, size, comments, uploaded_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(storedName, originalName, size, comments, now);

    saved.push({ id: info.lastInsertRowid, original_name: originalName, size });
  }
  res.json({ ok:true, saved });
});

app.post('/api/getlink', requireAuth, (req,res)=>{
  const { id } = req.body;
  const row = db.prepare(`SELECT id, stored_name FROM files WHERE id=?`).get(id);
  if (!row) return res.status(404).json({ ok:false, error: 'Not found' });

  const token = nanoid(24);
  const now = Date.now();
  db.prepare(`INSERT INTO links (file_id, token, created_at) VALUES (?,?,?)`).run(row.id, token, now);

  const base = publicBaseUrl(req);
  const pageUrl = `${base}/d/${token}`;
  const directUrl = `${base}/dl/${token}`;
  res.json({ ok:true, pageUrl, directUrl });
});

app.post('/api/delete', requireAuth, (req,res)=>{
  const ids = Array.isArray(req.body.ids) ? req.body.ids : [req.body.id].filter(Boolean);
  const sel = db.prepare(`SELECT id, stored_name FROM files WHERE id IN (${ids.map(_=>'?').join(',')})`).all(...ids);
  const tx = db.transaction((rows)=>{
    for (const r of rows) {
      db.prepare(`DELETE FROM files WHERE id=?`).run(r.id);
      const p = path.join(uploadsDir, r.stored_name);
      try { fs.unlinkSync(p); } catch {}
      db.prepare(`DELETE FROM links WHERE file_id=?`).run(r.id);
    }
  });
  tx(sel);
  res.json({ ok:true, deleted: sel.map(r=>r.id) });
});

function resolveLink(token) {
  const link = db.prepare(`SELECT id, file_id, created_at FROM links WHERE token=?`).get(token);
  if (!link) return null;
  if (Date.now() - link.created_at > LINK_TTL_MS) return { expired: true };
  const file = db.prepare(`SELECT * FROM files WHERE id=?`).get(link.file_id);
  if (!file) return null;
  return { link, file };
}

app.get('/d/:token', (req,res)=>{
  const info = resolveLink(req.params.token);
  if (!info) return res.status(404).send('Link not found');
  if (info.expired) return res.status(410).send('Link expired');
  res.sendFile(path.join(__dirname, 'public', 'download.html'));
});

app.get('/api/linkinfo/:token', (req,res)=>{
  const info = resolveLink(req.params.token);
  if (!info) return res.status(404).json({ ok:false });
  if (info.expired) return res.status(410).json({ ok:false, expired:true });
  const base = publicBaseUrl(req);
  const directUrl = `${base}/dl/${req.params.token}`;
  res.json({ ok:true, file: { name: info.file.original_name, size: info.file.size }, directUrl });
});

app.get('/dl/:token', downloadLimiter, (req,res)=>{
  const info = resolveLink(req.params.token);
  if (!info) return res.status(404).send('Link not found');
  if (info.expired) return res.status(410).send('Link expired');
  const filePath = path.join(uploadsDir, info.file.stored_name);
  const mimeType = mime.lookup(info.file.original_name) || 'application/octet-stream';
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(info.file.original_name)}"`);
  fs.createReadStream(filePath).pipe(res);
});

// Brand config for client
app.get('/api/brand', (req,res)=>{
  res.json({
    title: BRAND_TITLE,
    logo: BRAND_LOGO_URL,
    primary: BRAND_PRIMARY_COLOR,
    footer: FOOTER_TEXT,
    authEnabled: !!AUTH_BCRYPT_HASH
  });
});

// ---- Start ----
app.listen(PORT, ()=>{
  console.log(`File portal running on http://0.0.0.0:${PORT}`);
});
