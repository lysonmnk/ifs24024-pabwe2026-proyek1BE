import express from 'express';
import cors from 'cors';
import { CORS_ORIGIN } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/error-handler.js';
import { sendError } from './utils/response.js';
import { AppError } from './utils/app-error.js';

/**
 * Inisialisasi aplikasi Express utama.
 * Mengonfigurasi middleware keamanan CORS, parsing JSON body,
 * routing modular /api, penanganan rute tidak ditemukan (404),
 * dan centralized error handling middleware.
 */
const app = express();

// Parsing daftar origin yang diizinkan dari environment variable
const allowedOrigins = CORS_ORIGIN.split(',').map((origin) => origin.trim());

/**
 * Middleware Cross-Origin Resource Sharing (CORS).
 * Mengontrol akses domain frontend ke API backend untuk mencegah unauthorized cross-origin requests.
 */
app.use(
  cors({
    origin: (origin, callback) => {
      // Izinkan request tanpa origin (seperti curl, mobile app, postman) atau origin terdaftar / wildcard
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      // Tolak dengan AppError terstruktur agar pesan mentah tidak bocor ke client
      return callback(
        new AppError('Akses ditolak oleh kebijakan CORS', 403, [
          'Origin permintaan tidak diizinkan oleh kebijakan CORS server'
        ])
      );
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Middleware untuk mem-parse request body berformat JSON
app.use(express.json());

// Pemasangan router utama di bawah prefix /api
app.use('/api', routes);

// Penanganan fallback untuk rute / endpoint yang tidak terdaftar
app.use((req, res) => {
  return sendError(res, 404, `Endpoint ${req.originalUrl} tidak ditemukan`, [
    'Endpoint yang diminta tidak tersedia pada server ini'
  ]);
});

// Centralized error handling middleware sebagai penangkap akhir semua exception
app.use(errorHandler);

export default app;
