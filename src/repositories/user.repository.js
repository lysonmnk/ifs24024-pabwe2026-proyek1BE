import { getDatabase } from '../config/database.js';

/**
 * Repository data layer untuk tabel `users`.
 * Mengelola pembacaan dan penyimpanan kredensial akun pengguna
 * dengan prepared statements untuk mencegah eksploitasi SQL Injection.
 */
export class UserRepository {
  /**
   * @param {Object|null} [db=null] - Instance database opsional untuk pengujian unit
   */
  constructor(db = null) {
    this._db = db;
  }

  get db() {
    return this._db || getDatabase();
  }

  /**
   * Mencari akun pengguna berdasarkan alamat email.
   * Digunakan pada alur otentikasi login dan pengecekan duplikasi registrasi.
   *
   * @param {string} email - Alamat email pengguna terdaftar
   * @returns {Object|null} Objek user termasuk kolom password_hash untuk verifikasi bcrypt
   */
  findByEmail(email) {
    const query = `
      SELECT id, nama, email, password_hash, created_at
      FROM users
      WHERE email = ?
    `;
    return this.db.prepare(query).get(email) || null;
  }

  /**
   * Mengambil data profil publik pengguna berdasarkan ID (tanpa membocorkan password_hash).
   *
   * @param {number} id - ID pengguna
   * @returns {Object|null} Profil user aman ({ id, nama, email, created_at })
   */
  findById(id) {
    const query = `
      SELECT id, nama, email, created_at
      FROM users
      WHERE id = ?
    `;
    return this.db.prepare(query).get(id) || null;
  }

  /**
   * Menyisipkan pengguna baru ke tabel users dengan password yang telah di-hash.
   *
   * @param {Object} payload
   * @param {string} payload.nama - Nama lengkap
   * @param {string} payload.email - Email terverifikasi
   * @param {string} payload.password_hash - Hash kata sandi dari bcrypt
   * @returns {Object} Data user yang baru tersimpan (tanpa hash)
   */
  create({ nama, email, password_hash }) {
    const query = `
      INSERT INTO users (nama, email, password_hash)
      VALUES (?, ?, ?)
    `;
    const stmt = this.db.prepare(query);
    const result = stmt.run(nama, email, password_hash);
    return this.findById(result.lastInsertRowid);
  }
}

export const userRepository = new UserRepository();
