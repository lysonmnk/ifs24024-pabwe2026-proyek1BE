import { sendError } from '../utils/response.js';
import { AppError } from '../utils/app-error.js';

/**
 * Centralized Error Handling Middleware.
 * Menstandarkan seluruh format respons kesalahan (error response) di aplikasi backend.
 *
 * Mengklasifikasikan error menjadi:
 * 1. CORS Policy Errors -> status 403 Forbidden dengan pesan terstruktur yang aman (tanpa pesan mentah).
 * 2. Operational Errors (AppError) -> status sesuai domain error bisnis (400, 401, 403, 404, 409).
 * 3. Database Constraint / Integrity Errors -> status 400/409 tanpa mengekspos schema internal SQLite.
 * 4. Unexpected / Internal Server Errors -> status 500 dengan pesan generik aman tanpa kebocoran stack trace.
 *
 * @param {Error|AppError} err - Error object yang dilempar oleh service/controller/middleware
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 * @returns {import('express').Response} Response JSON berstruktur standar
 */
export const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  // 1. Tangani kesalahan penolakan kebijakan CORS secara aman dan terstruktur
  if (err.message && (err.message.includes('CORS') || err.message.includes('Origin tidak diizinkan'))) {
    return sendError(
      res,
      403,
      'Akses ditolak oleh kebijakan CORS',
      ['Origin permintaan tidak diizinkan untuk mengakses resource API ini']
    );
  }

  // 2. Tangani operational domain errors (AppError) yang sengaja dilempar oleh aplikasi
  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.message, err.errors);
  }

  // 3. Tangani pelanggaran batasan unik (UNIQUE constraint) SQLite
  if (err.code === 'SQLITE_CONSTRAINT' || (err.message && err.message.includes('UNIQUE constraint failed'))) {
    if (err.message.includes('users.email')) {
      return sendError(res, 409, 'Email sudah terdaftar', ['Email ini sudah digunakan oleh akun lain']);
    }
    return sendError(res, 400, 'Kesalahan integritas database', [
      'Data yang dikirim melanggar batasan keunikan database'
    ]);
  }

  // 4. Tangani error database SQLite umum lainnya tanpa membocorkan query mentah
  if (err.code && err.code.startsWith('SQLITE_')) {
    return sendError(res, 400, 'Kesalahan pada database', [
      'Terjadi kesalahan saat memproses data pada database'
    ]);
  }

  // 5. Tangani unhandled server error (500) - jangan mengekspos err.message mentah atau stack trace ke client
  console.error('Unhandled Internal Error:', err);
  return sendError(res, 500, 'Terjadi kesalahan pada server', [
    'Terjadi kesalahan internal pada server. Silakan coba beberapa saat lagi.'
  ]);
};
