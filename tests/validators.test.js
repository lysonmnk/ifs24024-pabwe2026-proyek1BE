import { describe, it, expect } from 'vitest';
import {
  validateRegister,
  validateLogin,
  validateMateri,
  validateSesi
} from '../src/utils/validators.js';

describe('Backend Centralized Validators', () => {
  describe('validateRegister', () => {
    it('mengembalikan error jika field kosong atau tidak valid', () => {
      const result = validateRegister({ nama: '', email: 'invalid-email', password: '123' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Nama lengkap wajib diisi');
      expect(result.errors).toContain('Format email tidak valid');
      expect(result.errors).toContain('Kata sandi minimal 8 karakter');
    });

    it('mengembalikan isValid true untuk data valid', () => {
      const result = validateRegister({
        nama: 'Lyson Manik',
        email: 'lyson@example.com',
        password: 'password123'
      });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateLogin', () => {
    it('mengembalikan error jika email atau kata sandi kosong', () => {
      const result = validateLogin({ email: '', password: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email wajib diisi');
      expect(result.errors).toContain('Kata sandi wajib diisi');
    });

    it('mengembalikan isValid true jika email dan kata sandi diisi', () => {
      const result = validateLogin({ email: 'user@test.com', password: 'secretpassword' });
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateMateri', () => {
    it('mengembalikan error jika judul kosong atau status tidak valid', () => {
      const result = validateMateri({ judul: '', status: 'unknown' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Judul materi wajib diisi');
      expect(result.errors.some((err) => err.includes('Status harus salah satu dari'))).toBe(true);
    });

    it('mengizinkan update parsial tanpa judul jika isUpdate true', () => {
      const result = validateMateri({ status: 'selesai' }, true);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateSesi', () => {
    it('menolak tanggal yang tidak valid atau durasi tidak valid', () => {
      const result = validateSesi({ tanggal: 'invalid-date', durasi_menit: 0 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Format tanggal harus YYYY-MM-DD');
      expect(result.errors).toContain('Durasi menit harus berupa bilangan bulat antara 1 hingga 1440');
    });

    it('menerima sesi dengan data yang valid', () => {
      const result = validateSesi({
        tanggal: '2026-10-25',
        durasi_menit: 60,
        catatan: 'Mempelajari best practice arsitektur express'
      });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
