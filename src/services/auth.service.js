import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../utils/app-error.js';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/env.js';
import { validateRegister, validateLogin } from '../utils/validators.js';

/**
 * Service untuk mengelola logika autentikasi dan otorisasi pengguna.
 * Menangani pendaftaran (register), verifikasi kredensial (login),
 * enkripsi kata sandi menggunakan bcrypt (work factor 10),
 * pembuatan token JSON Web Token (JWT), serta pengambilan profil pengguna.
 */
export class AuthService {
  /**
   * @param {import('../repositories/user.repository.js').UserRepository} repo - Dependensi user repository
   */
  constructor(repo = userRepository) {
    this.repo = repo;
  }

  /**
   * Memvalidasi input pendaftaran akun baru dengan mendelegasikan ke validator terpusat.
   *
   * @param {Object} payload
   * @param {string} payload.nama - Nama lengkap pengguna
   * @param {string} payload.email - Alamat email pengguna
   * @param {string} payload.password - Kata sandi plaintext
   * @throws {AppError} Jika data tidak memenuhi aturan validasi
   */
  validateRegisterInput({ nama, email, password }) {
    const { isValid, errors } = validateRegister({ nama, email, password });
    if (!isValid) {
      throw new AppError('Validasi registrasi gagal', 400, errors);
    }
  }

  /**
   * Memvalidasi kredensial login dengan mendelegasikan ke validator terpusat.
   *
   * @param {Object} payload
   * @param {string} payload.email - Alamat email pengguna
   * @param {string} payload.password - Kata sandi plaintext
   * @throws {AppError} Jika email atau password tidak diisi
   */
  validateLoginInput({ email, password }) {
    const { isValid, errors } = validateLogin({ email, password });
    if (!isValid) {
      throw new AppError('Input tidak valid', 400, errors);
    }
  }

  /**
   * Mendaftarkan pengguna baru ke dalam sistem:
   * 1. Validasi sintaksis input (nama, email, panjang sandi).
   * 2. Pengecekan keunikan email (mencegah duplikasi akun).
   * 3. Hashing kata sandi secara aman menggunakan bcrypt dengan salt rounds = 10.
   * 4. Penyimpanan record baru ke database via repository.
   *
   * @param {Object} payload - Objek input registrasi
   * @returns {Promise<{ id: number, nama: string, email: string, created_at: string }>} Profil pengguna terdaftar
   */
  async register({ nama, email, password }) {
    this.validateRegisterInput({ nama, email, password });

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = this.repo.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new AppError('Email sudah terdaftar', 409, ['Email sudah digunakan oleh akun lain']);
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = this.repo.create({
      nama: nama.trim(),
      email: normalizedEmail,
      password_hash
    });

    return {
      id: newUser.id,
      nama: newUser.nama,
      email: newUser.email,
      created_at: newUser.created_at
    };
  }

  /**
   * Melakukan verifikasi login pengguna dan menghasilkan JWT:
   * 1. Validasi input email dan kata sandi.
   * 2. Pencarian data pengguna di database berdasarkan email.
   * 3. Komparasi hash kata sandi yang aman dari serangan timing attack menggunakan bcrypt.compare.
   * 4. Pembuatan token JWT dengan klaim identitas (id, email, nama) dan waktu kedaluwarsa.
   *
   * @param {Object} payload - Objek kredensial login
   * @returns {Promise<{ token: string, user: { id: number, nama: string, email: string } }>} Token akses & data user
   */
  async login({ email, password }) {
    this.validateLoginInput({ email, password });

    const normalizedEmail = email.trim().toLowerCase();
    const user = this.repo.findByEmail(normalizedEmail);

    if (!user) {
      throw new AppError('Email atau kata sandi salah', 401, ['Email atau kata sandi salah']);
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AppError('Email atau kata sandi salah', 401, ['Email atau kata sandi salah']);
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      nama: user.nama
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    return {
      token,
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email
      }
    };
  }

  /**
   * Mengambil profil pengguna yang terautentikasi berdasarkan user ID.
   *
   * @param {number} userId - ID numerik pengguna dari JWT context
   * @returns {{ id: number, nama: string, email: string, created_at: string }} Data profil pengguna
   */
  getProfile(userId) {
    const user = this.repo.findById(userId);
    if (!user) {
      throw new AppError('Pengguna tidak ditemukan', 404, ['Data profil pengguna tidak ditemukan']);
    }
    return user;
  }
}

export const authService = new AuthService();
