import { materiRepository } from '../repositories/materi.repository.js';
import { AppError } from '../utils/app-error.js';
import { parseId } from '../utils/parse-id.js';
import { validateMateri, VALID_MATERI_STATUSES } from '../utils/validators.js';

export { VALID_MATERI_STATUSES };

/**
 * Service untuk menangani logika bisnis topik materi pembelajaran.
 * Menjamin isolasi data multi-tenant antar pengguna (user scoping),
 * mencegah kerentanan IDOR (Insecure Direct Object Reference),
 * dan mendelegasikan validasi ke modul validator terpusat.
 */
export class MateriService {
  /**
   * @param {import('../repositories/materi.repository.js').MateriRepository} repo - Dependensi repository materi
   */
  constructor(repo = materiRepository) {
    this.repo = repo;
  }

  /**
   * Memvalidasi data input materi pembelajaran menggunakan validator terpusat.
   *
   * @param {Object} payload - Objek input materi
   * @param {string} [payload.judul] - Judul materi
   * @param {string} [payload.status] - Status pembelajaran ('belum' | 'sedang' | 'selesai')
   * @param {string} [payload.sumber] - Sumber atau tautan referensi belajar
   * @param {boolean} [isUpdate=false] - True jika pembaruan data (kolom bersifat opsional)
   * @throws {AppError} Jika data tidak lolos validasi bisnis
   */
  validateMateriInput({ judul, status, sumber }, isUpdate = false) {
    const { isValid, errors } = validateMateri({ judul, status, sumber }, isUpdate);
    if (!isValid) {
      throw new AppError('Validasi gagal', 400, errors);
    }
  }

  /**
   * Mengambil semua materi belajar yang dimiliki oleh pengguna tertentu.
   *
   * @param {number} userId - ID pengguna pemilik data
   * @returns {Array<Object>} Koleksi daftar materi terurut
   */
  getAllMateri(userId) {
    return this.repo.findAllByUserId(userId);
  }

  /**
   * Mengambil detail materi berdasarkan ID dan ID pengguna.
   * Jika ID materi tidak ditemukan atau dimiliki oleh pengguna lain,
   * sengaja mengembalikan status 404 (bukan 403) untuk mencegah information disclosure (IDOR).
   *
   * @param {string|number} id - ID materi
   * @param {number} userId - ID pengguna pemilik
   * @returns {Object} Data entitas materi
   * @throws {AppError} 404 jika materi tidak ditemukan
   */
  getMateriById(id, userId) {
    const numericId = parseId(id, 'ID materi');
    const materi = this.repo.findByIdAndUserId(numericId, userId);

    if (!materi) {
      throw new AppError('Materi tidak ditemukan', 404, ['Materi tidak ditemukan']);
    }

    return materi;
  }

  /**
   * Membuat entitas materi belajar baru milik pengguna terautentikasi.
   *
   * @param {number} userId - ID pengguna pembuat materi
   * @param {Object} data - Payload materi ({ judul, status, sumber })
   * @returns {Object} Record materi yang baru dibuat di database
   */
  createMateri(userId, data) {
    this.validateMateriInput(data, false);

    const judul = data.judul.trim();
    const sumber = data.sumber && typeof data.sumber === 'string' ? data.sumber.trim() : null;
    const status = data.status || 'belum';

    return this.repo.create({
      user_id: userId,
      judul,
      sumber,
      status
    });
  }

  /**
   * Memperbarui materi pembelajaran milik pengguna.
   *
   * @param {string|number} id - ID materi yang akan diperbarui
   * @param {number} userId - ID pengguna pemilik
   * @param {Object} data - Payload atribut yang diperbarui
   * @returns {Object} Record materi setelah diperbarui
   */
  updateMateri(id, userId, data) {
    const existing = this.getMateriById(id, userId);

    this.validateMateriInput(data, true);

    const judul = data.judul !== undefined ? data.judul.trim() : existing.judul;
    const sumber = data.sumber !== undefined
      ? (typeof data.sumber === 'string' ? data.sumber.trim() : null)
      : existing.sumber;
    const status = data.status !== undefined ? data.status : existing.status;

    return this.repo.update(existing.id, userId, { judul, sumber, status });
  }

  /**
   * Menghapus materi pembelajaran dan sesi terkait secara cascade.
   *
   * @param {string|number} id - ID materi yang akan dihapus
   * @param {number} userId - ID pengguna pemilik
   * @returns {boolean} True jika berhasil dihapus
   */
  deleteMateri(id, userId) {
    const existing = this.getMateriById(id, userId);
    return this.repo.delete(existing.id, userId);
  }
}

export const materiService = new MateriService();
