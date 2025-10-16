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
const BRAND_PRIMARY_COLOR = process.env.BRAND_PRIMARY_COLOR || '';
const FOOTER_TEXT = process.env.FOOTER_TEXT || 'Powered by ChatGPT • © iAmSaugata';
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '200', 10);
const DOWNLOAD_RATE_LIMIT_MAX = parseInt(process.env.DOWNLOAD_RATE_LIMIT_MAX || '60', 10);
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || String(15*60*1000), 10);
const LINK_TTL_MS = parseInt(process.env.LINK_TTL_MS || String(24*60*60*1000), 10);

const SESSION_SECRET = process.env.SESSION_SECRET || 'change-me-please';
const AUTH_BCRYPT_HASH = process.env.AUTH_BCRYPT_HASH || '';
const MAX_UPLOAD_MB = parseInt(process.env.MAX_UPLOAD_MB || '200', 10);
const BASE_URL = (process.env.BASE_URL || '').trim();
const PARALLEL_UPLOADS = parseInt(process.env.PARALLEL_UPLOADS || '2', 10);

// ---- Trust proxy (Cloudflare-only default) ----
const TRUST_PROXY = process.env.TRUST_PROXY ?? '1';
const parsedTrust = TRUST_PROXY === 'true' ? true
                 : TRUST_PROXY === 'false' ? false
                 : Number.isFinite(parseInt(TRUST_PROXY, 10)) ? parseInt(TRUST_PROXY, 10)
                 : TRUST_PROXY;
app.set('trust proxy', parsedTrust);

const nanoId = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 21);

// CSP allows inline scripts + worker blobs
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "script-src": ["'self'", "'unsafe-inline'"],
      "style-src": ["'self'","'unsafe-inline'"],
      "worker-src": ["'self'", "blob:"],
      "img-src": ["'self'", "data:"],
      "connect-src": ["'self'"]
    }
  }
}));

// ---- Morgan: prefer Cloudflare client IP ----
morgan.token('remote-addr', (req) => {
  const ip = req.headers['cf-connecting-ip'] || req.ip || '';
  return String(ip).replace(/^::ffff:/, '');
});
morgan.token('cf-ray', (req) => req.headers['cf-ray'] || '-');
morgan.token('cf-country', (req) => req.headers['cf-ipcountry'] || '-');
app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" (cf-ray=:cf-ray country=:cf-country)'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser(SESSION_SECRET));
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));
app.use('/static', express.static(path.join(process.cwd(), 'public')));

// Limits
const generalLimiter = rateLimit({ windowMs: RATE_LIMIT_WINDOW_MS, max: RATE_LIMIT_MAX, standardHeaders:true, legacyHeaders:false });
app.use('/api', generalLimiter);
const downloadLimiter = rateLimit({ windowMs: RATE_LIMIT_WINDOW_MS, max: DOWNLOAD_RATE_LIMIT_MAX, standardHeaders:true, legacyHeaders:false });

// Branding locals
app.use((req,res,next)=>{
  res.locals.brandTitle = BRAND_TITLE;
  res.locals.brandLogo = BRAND_LOGO_URL;
  res.locals.footerText = FOOTER_TEXT;
  res.locals.brandPrimary = BRAND_PRIMARY_COLOR;
  next();
});

function authed(req){ return req.signedCookies && req.signedCookies.sess === 'ok'; }
function requireAuth(req,res,next){ if (AUTH_BCRYPT_HASH && !authed(req)) return res.redirect('/login'); next(); }

const loginLimiter = rateLimit({ windowMs: 5*60*1000, max: 20, standardHeaders:true, legacyHeaders:false });

app.get('/', (req,res)=>{ if (AUTH_BCRYPT_HASH) return authed(req) ? res.redirect('/dashboard') : res.redirect('/login'); return res.redirect('/dashboard'); });
app.get('/login', (req,res)=>{ if (!AUTH_BCRYPT_HASH) return res.redirect('/dashboard'); if (authed(req)) return res.redirect('/dashboard'); res.render('login', { error:null }); });
app.post('/login', loginLimiter, (req,res)=>{
  if (!AUTH_BCRYPT_HASH) return res.redirect('/dashboard');
  const { password } = req.body || {};
  const ok = password && bcrypt.compareSync(password, AUTH_BCRYPT_HASH);
  if (ok){ res.cookie('sess','ok',{signed:true,httpOnly:true,sameSite:'lax',maxAge:1000*60*60*24*30}); return res.redirect('/dashboard'); }
  return res.status(401).render('login',{ error:'Invalid password. Please try again.' });
});
app.get('/logout', (req,res)=>{ res.clearCookie('sess'); res.redirect('/login'); });

app.get('/dashboard', requireAuth, (req,res)=>{ const files = listFiles.all(); res.render('dashboard', { files, baseUrl: BASE_URL }); });

const uploadDir = path.join(process.cwd(), 'uploads'); fs.mkdirSync(uploadDir, { recursive: true });
const multerUpload = multer({ storage: multer.diskStorage({ destination: (req,f,cb)=>cb(null,uploadDir), filename:(req,f,cb)=>cb(null, nanoId()+path.extname(f.originalname||'')) }), limits: { fileSize: MAX_UPLOAD_MB*1024*1024 } });

app.get('/upload', requireAuth, (req,res)=> res.render('upload',{ disabled:false, parallel: PARALLEL_UPLOADS }));
app.post('/api/upload', requireAuth, multerUpload.array('files'), (req,res)=>{
  const comments = (req.body.comments || '').toString().slice(0,1000);
  const now = new Date().toISOString();
  const saved = [];
  for (const f of req.files || []){
    const info = insertFile.run({ stored_name:f.filename, original_name:f.originalname, size:f.size, comments, uploaded_at:now });
    saved.push({ id: info.lastInsertRowid, original_name: f.originalname, size: f.size });
  }
  res.json({ ok:true, saved });
});
app.post('/api/delete', requireAuth, (req,res)=>{
  const ids = Array.isArray(req.body.ids) ? req.body.ids.map(x=>parseInt(x,10)).filter(Number.isFinite) : [];
  if (!ids.length) return res.status(400).json({ ok:false, error:'No ids provided' });
  for (const id of ids){ const row = getFileById.get(id); if (row){ try{ fs.unlinkSync(path.join(uploadDir,row.stored_name)); }catch{} } }
  deleteFilesByIds(ids); res.json({ ok:true, removed: ids.length });
});
app.post('/api/getlink', requireAuth, (req,res)=>{
  const id = parseInt(req.body.id, 10);
  const row = getFileById.get(id);
  if (!row) return res.status(404).json({ ok:false, error:'File not found' });
  const token = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 21)();
  createLink.run({ file_id:id, token, created_at:new Date().toISOString() });
  const origin = BASE_URL || `${req.protocol}://${req.get('host')}`;
  res.json({ ok:true, pageUrl:`${origin}/d/${token}`, directUrl:`${origin}/dl/${token}` });
});

app.get('/d/:token', (req,res)=>{
  const token = req.params.token; const row = getLink.get(token);
  if (!row) return res.status(404).send('Invalid link');
  const age = Date.now() - new Date(row.created_at).getTime();
  if (age > LINK_TTL_MS) return res.status(410).send('Link expired');
  res.render('download',{ fileName: row.original_name, token });
});
app.get('/dl/:token', (req,res)=>{
  const token = req.params.token; const row = getLink.get(token);
  if (!row) return res.status(404).send('Invalid link');
  const age = Date.now() - new Date(row.created_at).getTime();
  if (age > LINK_TTL_MS) return res.status(410).send('Link expired');
  const filePath = path.join(uploadDir,row.stored_name);
  if (!fs.existsSync(filePath)) return res.status(404).send('File missing');
  const mimeType = mime.lookup(row.original_name) || 'application/octet-stream';
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(row.original_name)}"`);
  fs.createReadStream(filePath).pipe(res);
});

app.use((req,res)=>res.status(404).send('Not Found'));
app.listen(PORT, ()=> console.log(`File portal listening on :${PORT}`));
