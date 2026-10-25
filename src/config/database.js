import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { DB_PATH } from './env.js';

const require = createRequire(import.meta.url);

/**
 * Mendeteksi dan menginisialisasi driver SQLite yang kompatibel secara polimorfik.
 * Mengutamakan `better-sqlite3` untuk performa tinggi dengan fallback ke driver native Node.js
 * `node:sqlite` (DatabaseSync) jika better-sqlite3 native binary tidak kompatibel pada lingkungan runner.
 *
 * @returns {Function} Database constructor class
 */
const getDatabaseClass = () => {
  try {
    const mod = require('better-sqlite3');
    const Database = mod.default || mod;
    const probe = new Database(':memory:');
    probe.close();
    return Database;
  } catch {
    const { DatabaseSync } = require('node:sqlite');
    return DatabaseSync;
  }
};

let dbInstance = null;

/**
 * Menginisialisasi skema tabel dan integritas relasional database:
 * 1. Mengaktifkan foreign key constraints (PRAGMA foreign_keys = ON).
 * 2. Membuat tabel `users` (id, nama, email UNIQUE, password_hash, created_at).
 * 3. Membuat tabel `materi` dengan foreign key ke users dan batasan check status.
 * 4. Membuat tabel `sesi_belajar` dengan foreign key ke materi dan batasan durasi_menit > 0.
 *
 * @param {Object} db - Database driver instance
 */
export const initTables = (db) => {
  db.exec('PRAGMA foreign_keys = ON;');

  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      nama           TEXT NOT NULL,
      email          TEXT NOT NULL UNIQUE,
      password_hash  TEXT NOT NULL,
      created_at     TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createMateriTable = `
    CREATE TABLE IF NOT EXISTS materi (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL,
      judul       TEXT NOT NULL,
      sumber      TEXT,
      status      TEXT NOT NULL DEFAULT 'belum'
                  CHECK (status IN ('belum', 'sedang', 'selesai')),
      created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  const createSesiTable = `
    CREATE TABLE IF NOT EXISTS sesi_belajar (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      materi_id     INTEGER NOT NULL,
      tanggal       TEXT NOT NULL,
      durasi_menit  INTEGER NOT NULL CHECK (durasi_menit > 0),
      catatan       TEXT,
      created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (materi_id) REFERENCES materi(id) ON DELETE CASCADE
    );
  `;

  db.exec(createUsersTable);
  db.exec(createMateriTable);
  db.exec(createSesiTable);
};

/**
 * Mengambil singleton instance koneksi database aktif.
 * Otomatis membuat folder direktori database jika belum tersedia di filesystem.
 *
 * @param {string|null} [customPath=null] - Path database kustom (opsional, untuk isolasi test suite)
 * @returns {Object} Database singleton connection instance
 */
export const getDatabase = (customPath = null) => {
  if (dbInstance) {
    return dbInstance;
  }

  const Cls = getDatabaseClass();
  const targetPath = customPath || DB_PATH;

  if (targetPath !== ':memory:') {
    const dir = path.dirname(path.resolve(targetPath));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  dbInstance = new Cls(targetPath);
  initTables(dbInstance);
  return dbInstance;
};

/**
 * Menyuntikkan instance database kustom (digunakan dalam in-memory testing).
 *
 * @param {Object} db - Database instance
 * @returns {Object} Injected database instance
 */
export const setDatabase = (db) => {
  dbInstance = db;
  initTables(dbInstance);
  return dbInstance;
};

/**
 * Menutup koneksi database dan membersihkan singleton instance.
 */
export const closeDatabase = () => {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
};
