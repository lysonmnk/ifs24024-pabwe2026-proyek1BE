import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { getDatabase, closeDatabase } from '../src/config/database.js';

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

describe('Backend Autentikasi', () => {
  beforeEach(() => {
    closeDatabase();
    getDatabase(':memory:');
  });

  afterAll(() => {
    closeDatabase();
  });

  it('berhasil registrasi akun baru', async () => {
    const res = await request(app).post('/api/auth/register').send({
      nama: 'Lyson',
      email: 'lyson@example.com',
      password: 'rahasia123'
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('lyson@example.com');
    expect(res.body.data.password_hash).toBeUndefined();
  });

  it('menolak email yang sudah terdaftar', async () => {
    const payload = {
      nama: 'Lyson',
      email: 'lyson@example.com',
      password: 'rahasia123'
    };
    await request(app).post('/api/auth/register').send(payload);
    const res = await request(app).post('/api/auth/register').send(payload);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('menolak registrasi dengan input tidak valid', async () => {
    const res = await request(app).post('/api/auth/register').send({
      nama: 'A',
      email: 'bukan-email',
      password: '123'
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('berhasil login dan mengembalikan token', async () => {
    await request(app).post('/api/auth/register').send({
      nama: 'Lyson',
      email: 'lyson@example.com',
      password: 'rahasia123'
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'lyson@example.com',
      password: 'rahasia123'
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Login berhasil');
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('lyson@example.com');
  });

  it('mengembalikan pesan umum jika email atau kata sandi salah', async () => {
    await request(app).post('/api/auth/register').send({
      nama: 'Lyson',
      email: 'lyson@example.com',
      password: 'rahasia123'
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'lyson@example.com',
      password: 'salahsekali'
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Email atau kata sandi salah');
  });

  it('mengembalikan profil pengguna yang sedang login', async () => {
    await request(app).post('/api/auth/register').send({
      nama: 'Lyson',
      email: 'lyson@example.com',
      password: 'rahasia123'
    });
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'lyson@example.com',
      password: 'rahasia123'
    });

    const res = await request(app)
      .get('/api/auth/me')
      .set(authHeader(loginRes.body.data.token));

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('lyson@example.com');
    expect(res.body.data.password_hash).toBeUndefined();
  });

  it('menolak token yang tidak valid', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set(authHeader('token-palsu'));

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('mengisolasi data antar pengguna', async () => {
    await request(app).post('/api/auth/register').send({
      nama: 'Lyson',
      email: 'lyson@example.com',
      password: 'rahasia123'
    });
    await request(app).post('/api/auth/register').send({
      nama: 'Budi',
      email: 'budi@example.com',
      password: 'rahasia123'
    });

    const lysonLogin = await request(app).post('/api/auth/login').send({
      email: 'lyson@example.com',
      password: 'rahasia123'
    });
    const budiLogin = await request(app).post('/api/auth/login').send({
      email: 'budi@example.com',
      password: 'rahasia123'
    });

    const materiRes = await request(app)
      .post('/api/materi')
      .set(authHeader(lysonLogin.body.data.token))
      .send({ judul: 'Materi Pribadi Lyson', status: 'belum' });
    const materiId = materiRes.body.data.id;

    const otherUserRes = await request(app)
      .get(`/api/materi/${materiId}`)
      .set(authHeader(budiLogin.body.data.token));

    expect(otherUserRes.status).toBe(404);

    const listRes = await request(app)
      .get('/api/materi')
      .set(authHeader(budiLogin.body.data.token));
    expect(listRes.body.data).toEqual([]);
  });
});
