import { sesiRepository } from '../repositories/sesi.repository.js';
import { materiService } from './materi.service.js';
import { AppError } from '../utils/app-error.js';
import { parseId } from '../utils/parse-id.js';
import { validateSesi } from '../utils/validators.js';

/**
 * Service untuk mengelola log riwayat sesi belajar.
 * Menegakkan verifikasi kepemilikan relasional antara materi belajar dan sesi belajar,
 * serta memvalidasi tanggal kalender dan batasan durasi belajar harian.
 */
export class SesiService {
  /**
   * @param {import('../repositories/sesi.repository.js').SesiRepository} sesiRepo - Dependensi repository sesi
   * @param {import('./materi.service.js').MateriService} mService - Dependensi service materi
   */
  constructor(sesiRepo = sesiRepository, mService = materiService) {
    this.sesiRepo = sesiRepo;
    this.mService = mService;
  }

  /**
   * Memvalidasi input sesi belajar menggunakan modul validator terpusat.
   *
   * @param {Object} payload - Objek input sesi
   * @param {string} payload.tanggal - Tanggal sesi (YYYY-MM-DD)
   * @param {number|string} payload.durasi_menit - Durasi dalam menit (1-1440)
   * @param {string} [payload.catatan] - Catatan ringkasan sesi
   * @throws {AppError} Jika format tanggal atau rentang durasi tidak valid
   */
  validateSesiInput({ tanggal, durasi_menit, catatan }) {
    const { isValid, errors } = validateSesi({ tanggal, durasi_menit, catatan });
    if (!isValid) {
      throw new AppError('Validasi sesi gagal', 400, errors);
    }
  }

  /**
   * Mengambil riwayat sesi belajar dari suatu materi tertentu.
   * Memastikan materi tersebut adalah milik user yang sedang login sebelum menampilkan sesi.
   *
   * @param {string|number} materiId - ID materi induk
   * @param {number} userId - ID pengguna pemilik
   * @returns {Array<Object>} Daftar sesi belajar yang diurutkan descending berdasarkan tanggal
   */
  getSesiByMateriId(materiId, userId) {
    const numericMateriId = parseId(materiId, 'ID materi');
    // Memastikan materi ada dan milik pengguna (melempar 404 jika bukan milik user)
    this.mService.getMateriById(numericMateriId, userId);

    return this.sesiRepo.findByMateriId(numericMateriId);
  }

  /**
   * Mencatat sesi belajar baru pada materi yang ditentukan.
   *
   * @param {string|number} materiId - ID materi induk
   * @param {number} userId - ID pengguna pemilik
   * @param {Object} data - Payload sesi ({ tanggal, durasi_menit, catatan })
   * @returns {Object} Data sesi yang baru tersimpan di database
   */
  createSesi(materiId, userId, data) {
    const numericMateriId = parseId(materiId, 'ID materi');
    // Memastikan materi ada dan milik pengguna
    this.mService.getMateriById(numericMateriId, userId);

    this.validateSesiInput(data);

    const tanggal = data.tanggal.trim();
    const durasi_menit = Number(data.durasi_menit);
    const catatan = data.catatan && typeof data.catatan === 'string' ? data.catatan.trim() : null;

    return this.sesiRepo.create({
      materi_id: numericMateriId,
      tanggal,
      durasi_menit,
      catatan
    });
  }

  /**
   * Menghapus log sesi belajar berdasarkan ID sesi dan kepemilikan pengguna.
   *
   * @param {string|number} id - ID sesi yang akan dihapus
   * @param {number} userId - ID pengguna pemilik
   * @returns {boolean} True jika berhasil dihapus
   * @throws {AppError} 404 jika sesi tidak ditemukan atau bukan milik pengguna
   */
  deleteSesi(id, userId) {
    const numericId = parseId(id, 'ID sesi');
    const existing = this.sesiRepo.findByIdAndUserId(numericId, userId);

    if (!existing) {
      throw new AppError('Sesi belajar tidak ditemukan', 404, ['Sesi belajar tidak ditemukan']);
    }

    return this.sesiRepo.delete(numericId);
  }
}

export const sesiService = new SesiService();
