import { getDatabase } from '../config/database.js';

/**
 * Repository data layer untuk tabel `sesi_belajar`.
 * Menyediakan prepared statements untuk query riwayat log belajar
 * dan memastikan relasi foreign key ke tabel materi selalu terverifikasi.
 */
export class SesiRepository {
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
   * Mengambil semua sesi belajar yang berelasi dengan suatu materi tertentu.
   *
   * @param {number} materiId - ID materi induk
   * @returns {Array<Object>} Daftar record sesi diurutkan descending berdasarkan tanggal
   */
  findByMateriId(materiId) {
    const query = `
      SELECT id, materi_id, tanggal, durasi_menit, catatan, created_at
      FROM sesi_belajar
      WHERE materi_id = ?
      ORDER BY tanggal DESC, id DESC
    `;
    return this.db.prepare(query).all(materiId);
  }

  /**
   * Mengambil record sesi tunggal berdasarkan primary key ID.
   *
   * @param {number} id - ID sesi belajar
   * @returns {Object|null} Record sesi atau null jika tidak ditemukan
   */
  findById(id) {
    const query = `
      SELECT id, materi_id, tanggal, durasi_menit, catatan, created_at
      FROM sesi_belajar
      WHERE id = ?
    `;
    return this.db.prepare(query).get(id) || null;
  }

  /**
   * Mengambil sesi berdasarkan ID dengan melakukan JOIN ke tabel materi
   * untuk memverifikasi secara langsung bahwa sesi tersebut milik userId yang meminta.
   *
   * @param {number} id - ID sesi belajar
   * @param {number} userId - ID pengguna pemilik materi
   * @returns {Object|null} Record sesi jika terbukti sah milik user, atau null
   */
  findByIdAndUserId(id, userId) {
    const query = `
      SELECT s.id, s.materi_id, s.tanggal, s.durasi_menit, s.catatan, s.created_at
      FROM sesi_belajar s
      JOIN materi m ON s.materi_id = m.id
      WHERE s.id = ? AND m.user_id = ?
    `;
    return this.db.prepare(query).get(id, userId) || null;
  }

  /**
   * Menyisipkan record sesi belajar baru ke tabel sesi_belajar.
   *
   * @param {Object} payload
   * @param {number} payload.materi_id - ID materi yang dipelajari
   * @param {string} payload.tanggal - Tanggal sesi (YYYY-MM-DD)
   * @param {number} payload.durasi_menit - Durasi dalam menit
   * @param {string|null} [payload.catatan] - Catatan jurnal belajar
   * @returns {Object} Record sesi yang baru dibuat
   */
  create({ materi_id, tanggal, durasi_menit, catatan }) {
    const query = `
      INSERT INTO sesi_belajar (materi_id, tanggal, durasi_menit, catatan)
      VALUES (?, ?, ?, ?)
    `;
    const stmt = this.db.prepare(query);
    const result = stmt.run(materi_id, tanggal, durasi_menit, catatan || null);
    return this.findById(result.lastInsertRowid);
  }

  /**
   * Menghapus record sesi belajar berdasarkan ID.
   *
   * @param {number} id - ID sesi yang akan dihapus
   * @returns {boolean} True jika baris berhasil dihapus
   */
  delete(id) {
    const query = `DELETE FROM sesi_belajar WHERE id = ?`;
    const result = this.db.prepare(query).run(id);
    return result.changes > 0;
  }
}

export const sesiRepository = new SesiRepository();
