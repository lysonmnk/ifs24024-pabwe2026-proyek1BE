import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { getDatabase, closeDatabase } from '../src/config/database.js';

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

const registerAndLogin = async ({
  nama = 'Lyson',
  email = 'lyson@example.com',
  password = 'rahasia123'
} = {}) => {
  await request(app).post('/api/auth/register').send({ nama, email, password });
  const loginRes = await request(app).post('/api/auth/login').send({ email, password });
  return loginRes.body.data.token;
};

describe('Backend API Integration Tests', () => {
  beforeEach(() => {
    closeDatabase();
    getDatabase(':memory:');
  });

  afterAll(() => {
    closeDatabase();
  });

  describe('Health Check (/api/health)', () => {
    it('harus mengembalikan status OK dan message yang sesuai', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('API siap melayani permintaan');
      expect(res.body.data.status).toBe('OK');
      expect(res.body.data.timestamp).toBeDefined();
    });
  });

  describe('CRUD Materi Belajar (/api/materi)', () => {
    it('harus menolak akses tanpa token', async () => {
      const res = await request(app).get('/api/materi');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('harus mengembalikan daftar materi kosong saat pertama kali', async () => {
      const token = await registerAndLogin();
      const res = await request(app).get('/api/materi').set(authHeader(token));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    it('harus berhasil menambahkan materi baru', async () => {
      const token = await registerAndLogin();
      const payload = {
        judul: 'JavaScript Dasar',
        sumber: 'SoloLearn',
        status: 'sedang'
      };

      const res = await request(app)
        .post('/api/materi')
        .set(authHeader(token))
        .send(payload);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Materi berhasil dibuat');
      expect(res.body.data.judul).toBe('JavaScript Dasar');
      expect(res.body.data.sumber).toBe('SoloLearn');
      expect(res.body.data.status).toBe('sedang');
      expect(res.body.data.total_menit).toBe(0);
    });

    it('harus gagal saat menambahkan materi tanpa judul', async () => {
      const token = await registerAndLogin();
      const res = await request(app)
        .post('/api/materi')
        .set(authHeader(token))
        .send({ judul: '   ', status: 'belum' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toContain('Judul materi wajib diisi');
    });

    it('harus gagal saat status tidak valid', async () => {
      const token = await registerAndLogin();
      const res = await request(app)
        .post('/api/materi')
        .set(authHeader(token))
        .send({ judul: 'Vue.js Lanjut', status: 'pending' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors[0]).toContain('Status harus salah satu dari');
    });

    it('harus mengembalikan detail materi berdasarkan ID', async () => {
      const token = await registerAndLogin();
      const createRes = await request(app)
        .post('/api/materi')
        .set(authHeader(token))
        .send({ judul: 'Express.js', status: 'belum' });
      const id = createRes.body.data.id;

      const res = await request(app).get(`/api/materi/${id}`).set(authHeader(token));
      expect(res.status).toBe(200);
      expect(res.body.data.judul).toBe('Express.js');
    });

    it('harus mengembalikan 404 jika materi tidak ditemukan', async () => {
      const token = await registerAndLogin();
      const res = await request(app).get('/api/materi/9999').set(authHeader(token));
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('harus berhasil memperbarui materi', async () => {
      const token = await registerAndLogin();
      const createRes = await request(app)
        .post('/api/materi')
        .set(authHeader(token))
        .send({ judul: 'React 18', status: 'belum' });
      const id = createRes.body.data.id;

      const res = await request(app)
        .put(`/api/materi/${id}`)
        .set(authHeader(token))
        .send({ judul: 'React 19', status: 'selesai' });

      expect(res.status).toBe(200);
      expect(res.body.data.judul).toBe('React 19');
      expect(res.body.data.status).toBe('selesai');
    });

    it('harus berhasil menghapus materi beserta sesi belajarnya', async () => {
      const token = await registerAndLogin();
      const createRes = await request(app)
        .post('/api/materi')
        .set(authHeader(token))
        .send({ judul: 'Hapus Aku', status: 'belum' });
      const id = createRes.body.data.id;

      const deleteRes = await request(app)
        .delete(`/api/materi/${id}`)
        .set(authHeader(token));
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);

      const checkRes = await request(app).get(`/api/materi/${id}`).set(authHeader(token));
      expect(checkRes.status).toBe(404);
    });
  });

  describe('Sesi Belajar (/api/materi/:materiId/sesi dan /api/sesi/:id)', () => {
    it('harus berhasil mencatat sesi belajar dan memperbarui total_menit', async () => {
      const token = await registerAndLogin();
      const materiRes = await request(app)
        .post('/api/materi')
        .set(authHeader(token))
        .send({ judul: 'CSS Grid & Flexbox', status: 'sedang' });
      const materiId = materiRes.body.data.id;

      const sesiRes1 = await request(app)
        .post(`/api/materi/${materiId}/sesi`)
        .set(authHeader(token))
        .send({
          tanggal: '2026-10-23',
          durasi_menit: 45,
          catatan: 'Latihan layout grid 3 kolom'
        });
      expect(sesiRes1.status).toBe(201);
      expect(sesiRes1.body.data.durasi_menit).toBe(45);

      await request(app)
        .post(`/api/materi/${materiId}/sesi`)
        .set(authHeader(token))
        .send({
          tanggal: '2026-10-24',
          durasi_menit: 60,
          catatan: 'Belajar responsive design'
        });

      const listSesiRes = await request(app)
        .get(`/api/materi/${materiId}/sesi`)
        .set(authHeader(token));
      expect(listSesiRes.status).toBe(200);
      expect(listSesiRes.body.data.length).toBe(2);

      const getMateriRes = await request(app)
        .get(`/api/materi/${materiId}`)
        .set(authHeader(token));
      expect(getMateriRes.body.data.total_menit).toBe(105);
    });

    it('harus menolak sesi belajar dengan durasi 0 atau negatif', async () => {
      const token = await registerAndLogin();
      const materiRes = await request(app)
        .post('/api/materi')
        .set(authHeader(token))
        .send({ judul: 'Python', status: 'belum' });
      const materiId = materiRes.body.data.id;

      const res = await request(app)
        .post(`/api/materi/${materiId}/sesi`)
        .set(authHeader(token))
        .send({
          tanggal: '2026-10-23',
          durasi_menit: 0,
          catatan: 'Invalid'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors[0]).toContain('bilangan bulat');
    });

    it('harus menolak sesi belajar jika materiId tidak ditemukan', async () => {
      const token = await registerAndLogin();
      const res = await request(app)
        .post('/api/materi/999/sesi')
        .set(authHeader(token))
        .send({
          tanggal: '2026-10-23',
          durasi_menit: 30
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('harus berhasil menghapus sesi belajar', async () => {
      const token = await registerAndLogin();
      const materiRes = await request(app)
        .post('/api/materi')
        .set(authHeader(token))
        .send({ judul: 'Docker', status: 'belum' });
      const materiId = materiRes.body.data.id;

      const sesiRes = await request(app)
        .post(`/api/materi/${materiId}/sesi`)
        .set(authHeader(token))
        .send({
          tanggal: '2026-10-23',
          durasi_menit: 30,
          catatan: 'Container dasar'
        });
      const sesiId = sesiRes.body.data.id;

      const deleteRes = await request(app)
        .delete(`/api/sesi/${sesiId}`)
        .set(authHeader(token));
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);

      const listRes = await request(app)
        .get(`/api/materi/${materiId}/sesi`)
        .set(authHeader(token));
      expect(listRes.body.data.length).toBe(0);
    });
  });
});
