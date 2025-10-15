import express from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import multer from 'multer';
import { customAlphabet } from 'nanoid';
import bcrypt from 'bcryptjs';
import { insertFile, listFiles, deleteFilesByIds, createLink, getLink, getFileById } from './db.js';
import mime from 'mime-types';

const app = express();
const PORT = process.env.PORT || 8080;
const BRAND_TITLE = process.env.BRAND_TITLE || 'File Management';
const BRAND_LOGO_URL = process.env.BRAND_LOGO_URL || '';
const BRAND_PRIMARY_COLOR = process.env.BRAND_PRIMARY_COLOR || ''; // optional CSS override
const FOOTER_TEXT = process.env.FOOTER_TEXT || 'Powered by ChatGPT • © iAmSaugata';
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '200', 10);
const DOWNLOAD_RATE_LIMIT_MAX = parseInt(process.env.DOWNLOAD_RATE_LIMIT_MAX || '60', 10);
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || String(15*60*1000), 10);
const LINK_TTL_MS = parseInt(process.env.LINK_TTL_MS || String(24*60*60*1000), 10); // 24 hours default

const SESSION_SECRET = process.env.SESSION_SECRET || 'change-me-please';
const AUTH_BCRYPT_HASH = process.env.AUTH_BCRYPT_HASH || '';
const MAX_UPLOAD_MB = parseInt(process.env.MAX_UPLOAD_MB || '100', 10);
const BASE_URL = (process.env.BASE_URL || '').trim();

const nanoId = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 21);

const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Security & common middleware
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "script-src": ["'self'"],
      "style-src": ["'self'","'unsafe-inline'"],
    }
  }
}));
app.use(morgan('combined'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser(SESSION_SECRET));

// General rate limit (for API)
const generalLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', generalLimiter);

// Download rate limit (token fetch)
const downloadLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: DOWNLOAD_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false
});

// Expose brand vars to views
app.use((req,res,next)=>{
  res.locals.brandTitle = BRAND_TITLE;
  res.locals.brandLogo = BRAND_LOGO_URL;
  res.locals.footerText = FOOTER_TEXT;
  res.locals.brandPrimary = BRAND_PRIMARY_COLOR;
  next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));
app.use('/static', express.static(path.join(process.cwd(), 'public')));

// Simple session check using signed cookie
function authed(req) {
  return req.signedCookies && req.signedCookies.sess === 'ok';
}

function requireAuth(req, res, next) {
  if (AUTH_BCRYPT_HASH && !authed(req)) {
    return res.redirect('/login');
  }
  next();
}

// Rate limit login attempts
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false
});

// Routes
app.get('/', (req, res) => {
  if (AUTH_BCRYPT_HASH) {
    if (authed(req)) return res.redirect('/dashboard');
    return res.redirect('/login');
  }
  return res.redirect('/dashboard');
});

app.get('/login', (req, res) => {
  if (!AUTH_BCRYPT_HASH) return res.redirect('/dashboard');
  if (authed(req)) return res.redirect('/dashboard');
  res.render('login', { error: null });
});

app.post('/login', loginLimiter, (req, res) => {
  if (!AUTH_BCRYPT_HASH) return res.redirect('/dashboard');
  const { password } = req.body || {};
  const ok = password && bcrypt.compareSync(password, AUTH_BCRYPT_HASH);
  if (ok) {
    // set a persistent cookie
    res.cookie('sess', 'ok', { signed: true, httpOnly: true, sameSite: 'lax', maxAge: 1000*60*60*24*30 });
    return res.redirect('/dashboard');
  }
  return res.status(401).render('login', { error: 'Invalid password. Please try again.' });
});

app.get('/logout', (req, res) => {
  res.clearCookie('sess');
  res.redirect('/login');
});

// Dashboard
app.get('/dashboard', requireAuth, (req, res) => {
  const files = listFiles.all();
  res.render('dashboard', { files, baseUrl: BASE_URL });
});

// File uploads
const uploadDir = path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, nanoId() + path.extname(file.originalname || ''))
  }),
  limits: {
    fileSize: MAX_UPLOAD_MB * 1024 * 1024
  }
});

app.get('/upload', requireAuth, (req, res) => {
  res.render('upload', { disabled: false });
});

app.post('/api/upload', requireAuth, upload.array('files'), (req, res) => {
  const comments = (req.body.comments || '').toString().slice(0, 1000);
  const now = new Date().toISOString();
  const saved = [];

  for (const f of req.files || []) {
    insertFile.run({
      stored_name: f.filename,
      original_name: f.originalname,
      size: f.size,
      comments,
      uploaded_at: now
    });
    saved.push({ original_name: f.originalname, size: f.size });
  }
  res.json({ ok: true, saved });
});

// Delete (bulk or single)
app.post('/api/delete', requireAuth, (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids.map(x => parseInt(x,10)).filter(Number.isFinite) : [];
  if (!ids.length) return res.status(400).json({ ok: false, error: 'No ids provided' });

  // remove files from disk first, then DB
  for (const id of ids) {
    const row = getFileById.get(id);
    if (row) {
      try { fs.unlinkSync(path.join(uploadDir, row.stored_name)); } catch {}
    }
  }
  deleteFilesByIds(ids);
  res.json({ ok: true, removed: ids.length });
});

// Create link
app.post('/api/getlink', requireAuth, (req, res) => {
  const id = parseInt(req.body.id, 10);
  const row = getFileById.get(id);
  if (!row) return res.status(404).json({ ok: false, error: 'File not found' });

  const token = nanoId();
  createLink.run({ file_id: id, token, created_at: new Date().toISOString() });

  const origin = BASE_URL || `${req.protocol}://${req.get('host')}`;
  const pageUrl = `${origin}/d/${token}`;
  const directUrl = `${origin}/dl/${token}`;

  res.json({ ok: true, pageUrl, directUrl });
});

// Download landing page (card view)
app.get('/d/:token', (req, res) => {
  const token = req.params.token;
  const row = getLink.get(token);
  if (!row) return res.status(404).send('Invalid link');
  const age = Date.now() - new Date(row.created_at).getTime();
  if (age > LINK_TTL_MS) return res.status(410).send('Link expired');
  res.render('download', {
    fileName: row.original_name,
    token,
  });
});

// Actual download (no password)
app.get('/dl/:token', downloadLimiter, (req, res) => {
  const token = req.params.token;
  const row = getLink.get(token);
  if (!row) return res.status(404).send('Invalid link');
  const age = Date.now() - new Date(row.created_at).getTime();
  if (age > LINK_TTL_MS) return res.status(410).send('Link expired');

  const filePath = path.join(uploadDir, row.stored_name);
  if (!fs.existsSync(filePath)) return res.status(404).send('File missing');

  const mimeType = mime.lookup(row.original_name) || 'application/octet-stream';
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(row.original_name)}"`);
  fs.createReadStream(filePath).pipe(res);
});

// 404
app.use((req, res) => res.status(404).send('Not Found'));

app.listen(PORT, () => {
  console.log(`File portal listening on :${PORT}`);
});
