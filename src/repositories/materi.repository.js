import { getDatabase } from '../config/database.js';

/**
 * Repository data layer untuk tabel `materi`.
 * Mengelola interaksi basis data SQLite menggunakan parameterized queries
 * untuk menjamin keamanan dari serangan SQL Injection dan menegakkan isolasi multi-tenant.
 */
export class MateriRepository {
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
   * Mengambil semua materi belajar milik user_id tertentu dengan agregasi total durasi belajar.
   * Menggunakan LEFT JOIN ke tabel sesi_belajar untuk menghitung total waktu kumulatif per materi.
   *
   * @param {number} userId - ID pengguna pemilik data
   * @returns {Array<Object>} Daftar record materi beserta kolom kalkulasi total_menit
   */
  findAllByUserId(userId) {
    const query = `
      SELECT 
        m.id,
        m.user_id,
        m.judul,
        m.sumber,
        m.status,
        m.created_at,
        CAST(COALESCE(SUM(s.durasi_menit), 0) AS INTEGER) AS total_menit
      FROM materi m
      LEFT JOIN sesi_belajar s ON m.id = s.materi_id
      WHERE m.user_id = ?
      GROUP BY m.id
      ORDER BY m.created_at DESC, m.id DESC
    `;
    return this.db.prepare(query).all(userId);
  }

  /**
   * Mengambil detail materi tunggal berdasarkan ID materi dan ID pengguna.
   * Memastikan pengguna hanya dapat membaca materi miliknya sendiri.
   *
   * @param {number} id - ID materi
   * @param {number} userId - ID pengguna pemilik
   * @returns {Object|null} Objek materi lengkap dengan total_menit atau null jika tidak ditemukan
   */
  findByIdAndUserId(id, userId) {
    const query = `
      SELECT 
        m.id,
        m.user_id,
        m.judul,
        m.sumber,
        m.status,
        m.created_at,
        CAST(COALESCE(SUM(s.durasi_menit), 0) AS INTEGER) AS total_menit
      FROM materi m
      LEFT JOIN sesi_belajar s ON m.id = s.materi_id
      WHERE m.id = ? AND m.user_id = ?
      GROUP BY m.id
    `;
    return this.db.prepare(query).get(id, userId) || null;
  }

  /**
   * Menyisipkan record materi pembelajaran baru ke dalam tabel materi.
   *
   * @param {Object} payload
   * @param {number} payload.user_id - ID pemilik
   * @param {string} payload.judul - Judul materi
   * @param {string|null} payload.sumber - Sumber materi (opsional)
   * @param {string} payload.status - Status belajar
   * @returns {Object} Record materi yang baru dibuat
   */
  create({ user_id, judul, sumber, status }) {
    const query = `
      INSERT INTO materi (user_id, judul, sumber, status)
      VALUES (?, ?, ?, ?)
    `;
    const stmt = this.db.prepare(query);
    const result = stmt.run(user_id, judul, sumber, status);
    return this.findByIdAndUserId(result.lastInsertRowid, user_id);
  }

  /**
   * Memperbarui atribut materi pembelajaran milik pengguna yang bersangkutan.
   *
   * @param {number} id - ID materi
   * @param {number} userId - ID pemilik
   * @param {Object} payload - Atribut yang diperbarui
   * @returns {Object|null} Record materi setelah update
   */
  update(id, userId, { judul, sumber, status }) {
    const query = `
      UPDATE materi
      SET judul = ?, sumber = ?, status = ?
      WHERE id = ? AND user_id = ?
    `;
    const stmt = this.db.prepare(query);
    stmt.run(judul, sumber, status, id, userId);
    return this.findByIdAndUserId(id, userId);
  }

  /**
   * Menghapus materi pembelajaran dari database. Relasi sesi akan otomatis terhapus (CASCADE).
   *
   * @param {number} id - ID materi
   * @param {number} userId - ID pemilik
   * @returns {boolean} True jika ada baris yang terhapus
   */
  delete(id, userId) {
    const query = `DELETE FROM materi WHERE id = ? AND user_id = ?`;
    const result = this.db.prepare(query).run(id, userId);
    return result.changes > 0;
  }
}

export const materiRepository = new MateriRepository();
