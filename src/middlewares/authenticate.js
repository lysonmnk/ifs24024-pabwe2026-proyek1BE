import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';
import { sendError } from '../utils/response.js';

/**
 * Middleware Autentikasi JSON Web Token (JWT).
 * Melindungi rute privat dengan memvalidasi Bearer Token pada header HTTP Authorization.
 *
 * Alur Kerja Keamanan:
 * 1. Mengekstrak header `Authorization`.
 * 2. Memeriksa format skema `Bearer <token>`. Jika tidak ada/salah, menolak dengan 401 Unauthorized.
 * 3. Memverifikasi integritas kriptografis token menggunakan JWT_SECRET.
 * 4. Menangani kasus token kedaluwarsa (`TokenExpiredError`) secara spesifik dan ramah pengguna.
 * 5. Menyuntikkan decoded payload pengguna ke `req.user` untuk digunakan oleh controller dan service layer berikutnya.
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 401, 'Akses ditolak', ['Token autentikasi tidak ditemukan. Silakan login terlebih dahulu.']);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Token kedaluwarsa', ['Sesi login Anda telah berakhir. Silakan login kembali.']);
    }
    return sendError(res, 401, 'Token tidak valid', ['Token autentikasi tidak valid atau telah dimodifikasi.']);
  }
};
