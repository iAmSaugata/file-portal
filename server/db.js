import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'sqlite', 'portal.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stored_name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  size INTEGER NOT NULL,
  comments TEXT,
  uploaded_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  FOREIGN KEY(file_id) REFERENCES files(id) ON DELETE CASCADE
);
`);

export const insertFile = db.prepare(`
INSERT INTO files (stored_name, original_name, size, comments, uploaded_at)
VALUES (@stored_name, @original_name, @size, @comments, @uploaded_at)
`);

export const listFiles = db.prepare(`
SELECT id, stored_name, original_name, size, comments, uploaded_at
FROM files
ORDER BY uploaded_at DESC
`);

export const getFileById = db.prepare(`
SELECT id, stored_name, original_name, size, uploaded_at, comments FROM files WHERE id = ?
`);

export const deleteFilesByIds = (ids) => {
  const delLinks = db.prepare('DELETE FROM links WHERE file_id = ?');
  const delFile = db.prepare('DELETE FROM files WHERE id = ?');
  const txn = db.transaction((ids) => {
    for (const id of ids) {
      delLinks.run(id);
      delFile.run(id);
    }
  });
  txn(ids);
};

export const createLink = db.prepare(`
INSERT INTO links (file_id, token, created_at)
VALUES (@file_id, @token, @created_at)
`);

export const getLink = db.prepare(`
SELECT l.id, l.file_id, l.token, l.created_at, f.original_name, f.stored_name, f.size
FROM links l
JOIN files f ON f.id = l.file_id
WHERE l.token = ?
`);

export default db;
