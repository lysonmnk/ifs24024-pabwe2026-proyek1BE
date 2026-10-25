# Catatan Belajar Ngoding - Backend API (Proyek 1 PABWE 2026)

Repositori Backend API untuk aplikasi **Catatan Belajar Ngoding** yang dibangun menggunakan Node.js, Express.js, SQLite, dan JWT Authentication.

- **NIM**: 11S24024
- **Nama**: Lyson Paulus Esar Manik
- **Mata Kuliah**: Pengembangan Aplikasi Berbasis Web (PABWE) 2026

---

## 🛠️ Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite (better-sqlite3)
- **Autentikasi**: JSON Web Token (JWT) & bcryptjs
- **Pengujian**: Vitest & Supertest

---

## 📂 Struktur Proyek
```
.
├── src/
│   ├── config/          # Konfigurasi database & environment variables
│   ├── controllers/     # HTTP Request handler (Auth, Materi, Sesi)
│   ├── middlewares/     # JWT authentication & error handler
│   ├── repositories/    # Data access layer ke database SQLite
│   ├── routes/          # Express route definitions
│   ├── services/        # Business logic layer
│   ├── utils/           # Centralized validators & response formatter
│   ├── app.js           # Express app instance & middlewares
│   └── server.js        # Entry point server
├── tests/               # Unit & Integration test suite
├── .env.example         # Template konfigurasi environment
├── package.json
└── vitest.config.js
```

---

## 🚀 Menjalankan Backend Secara Lokal

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Konfigurasi Environment Variable
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Isi konfigurasi standar:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=supersecretkey_pabwe2026_ifs24024
CORS_ORIGIN=*
DB_PATH=./data/catatan.db
```

### 3. Menjalankan Server
```bash
# Mode Development
npm run dev

# Mode Production
npm start
```

Server akan aktif di: `http://localhost:5000`

---

## 🧪 Menjalankan Automated Tests
```bash
# Menjalankan seluruh test suite
npm test

# Menjalankan test dengan laporan code coverage
npm run test:coverage
```

---

## 📡 Dokumentasi Endpoint API

### Autentikasi (`/api/auth`)
- `POST /api/auth/register` - Registrasi akun baru
- `POST /api/auth/login` - Login pengguna & mendapatkan token JWT
- `GET /api/auth/profile` - Mengambil profil pengguna yang terautentikasi

### Topik Materi Belajar (`/api/materi`)
- `GET /api/materi` - Mengambil daftar seluruh materi belajar
- `GET /api/materi/:id` - Mengambil detail materi belajar
- `POST /api/materi` - Menambahkan materi belajar baru
- `PUT /api/materi/:id` - Memperbarui status / judul materi belajar
- `DELETE /api/materi/:id` - Menghapus materi belajar beserta sesinya

### Riwayat Sesi Belajar (`/api/sesi` & `/api/materi/:materiId/sesi`)
- `POST /api/materi/:materiId/sesi` - Mencatat log sesi belajar baru
- `DELETE /api/sesi/:id` - Menghapus catatan sesi belajar
