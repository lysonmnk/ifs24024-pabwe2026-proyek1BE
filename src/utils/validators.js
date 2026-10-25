/**
 * Modul Validasi Terpusat Backend (Backend Centralized Validators)
 * 
 * Modul ini menyatukan spesifikasi dan aturan validasi input bisnis di backend,
 * selaras dengan skema validasi frontend untuk mengeliminasi duplikasi logika validasi.
 * Mengembalikan objek konsisten { isValid: boolean, errors: string[] }
 * untuk kemudian dilempar sebagai AppError oleh service layer.
 */

/**
 * Memvalidasi data pendaftaran akun baru.
 * 
 * Aturan:
 * - nama: wajib diisi string non-empty, panjang 2 hingga 50 karakter
 * - email: wajib diisi string non-empty, format email standar (RFC 5322 regex)
 * - password: wajib diisi string non-empty, minimal 8 karakter
 * 
 * @param {Object} input - Data registrasi dari request body
 * @param {string} input.nama - Nama lengkap pengguna
 * @param {string} input.email - Alamat email pengguna
 * @param {string} input.password - Kata sandi plaintext
 * @returns {{ isValid: boolean, errors: string[] }} Hasil evaluasi validasi
 */
export const validateRegister = ({ nama, email, password } = {}) => {
  const errors = [];

  if (!nama || typeof nama !== 'string' || nama.trim() === '') {
    errors.push('Nama lengkap wajib diisi');
  } else if (nama.trim().length < 2 || nama.trim().length > 50) {
    errors.push('Nama harus berisi antara 2 hingga 50 karakter');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || email.trim() === '') {
    errors.push('Email wajib diisi');
  } else if (!emailRegex.test(email.trim())) {
    errors.push('Format email tidak valid');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Kata sandi wajib diisi');
  } else if (password.length < 8) {
    errors.push('Kata sandi minimal 8 karakter');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Memvalidasi data kredensial login akun.
 * 
 * Aturan:
 * - email: wajib diisi string non-empty
 * - password: wajib diisi string non-empty
 * 
 * @param {Object} input - Data login dari request body
 * @param {string} input.email - Alamat email pengguna
 * @param {string} input.password - Kata sandi plaintext
 * @returns {{ isValid: boolean, errors: string[] }} Hasil evaluasi validasi
 */
export const validateLogin = ({ email, password } = {}) => {
  const errors = [];

  if (!email || typeof email !== 'string' || email.trim() === '') {
    errors.push('Email wajib diisi');
  }

  if (!password || typeof password !== 'string' || password === '') {
    errors.push('Kata sandi wajib diisi');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const VALID_MATERI_STATUSES = ['belum', 'sedang', 'selesai'];

/**
 * Memvalidasi data materi pembelajaran.
 * 
 * Aturan:
 * - judul: wajib saat create, maksimal 100 karakter
 * - status: salah satu dari ['belum', 'sedang', 'selesai']
 * - sumber: opsional, string maksimal 100 karakter
 * 
 * @param {Object} input - Data materi belajar
 * @param {string} [input.judul] - Judul topik materi
 * @param {string} [input.status] - Status progres belajar
 * @param {string} [input.sumber] - Referensi atau URL materi
 * @param {boolean} [isUpdate=false] - Flag apakah operasi berupa pembaruan parsial (PUT)
 * @returns {{ isValid: boolean, errors: string[] }} Hasil evaluasi validasi
 */
export const validateMateri = ({ judul, status, sumber } = {}, isUpdate = false) => {
  const errors = [];

  if (!isUpdate || judul !== undefined) {
    if (!judul || typeof judul !== 'string' || judul.trim() === '') {
      errors.push('Judul materi wajib diisi');
    } else if (judul.trim().length > 100) {
      errors.push('Judul materi maksimal 100 karakter');
    }
  }

  if (status !== undefined) {
    if (!VALID_MATERI_STATUSES.includes(status)) {
      errors.push(`Status harus salah satu dari: ${VALID_MATERI_STATUSES.join(', ')}`);
    }
  }

  if (sumber !== undefined && sumber !== null && typeof sumber !== 'string') {
    errors.push('Sumber materi harus berupa teks');
  } else if (sumber && typeof sumber === 'string' && sumber.trim().length > 100) {
    errors.push('Sumber materi maksimal 100 karakter');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Memvalidasi data log sesi belajar.
 * 
 * Aturan:
 * - tanggal: wajib format ISO YYYY-MM-DD dan tanggal kalender valid
 * - durasi_menit: wajib bilangan bulat positif antara 1 hingga 1440 menit (24 jam)
 * - catatan: opsional, string maksimal 500 karakter
 * 
 * @param {Object} input - Data sesi belajar
 * @param {string} input.tanggal - Tanggal sesi pembelajaran (YYYY-MM-DD)
 * @param {number|string} input.durasi_menit - Durasi dalam satuan menit
 * @param {string} [input.catatan] - Catatan ringkasan atau jurnal sesi
 * @returns {{ isValid: boolean, errors: string[] }} Hasil evaluasi validasi
 */
export const validateSesi = ({ tanggal, durasi_menit, catatan } = {}) => {
  const errors = [];

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!tanggal || typeof tanggal !== 'string' || tanggal.trim() === '') {
    errors.push('Tanggal sesi wajib diisi');
  } else if (!dateRegex.test(tanggal.trim())) {
    errors.push('Format tanggal harus YYYY-MM-DD');
  } else {
    const parsed = new Date(tanggal.trim());
    if (isNaN(parsed.getTime())) {
      errors.push('Tanggal tidak valid');
    }
  }

  const durasi = Number(durasi_menit);
  if (durasi_menit === undefined || durasi_menit === null || isNaN(durasi)) {
    errors.push('Durasi menit wajib diisi dengan angka');
  } else if (!Number.isInteger(durasi) || durasi < 1 || durasi > 1440) {
    errors.push('Durasi menit harus berupa bilangan bulat antara 1 hingga 1440');
  }

  if (catatan !== undefined && catatan !== null && typeof catatan !== 'string') {
    errors.push('Catatan harus berupa teks');
  } else if (catatan && typeof catatan === 'string' && catatan.trim().length > 500) {
    errors.push('Catatan maksimal 500 karakter');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
