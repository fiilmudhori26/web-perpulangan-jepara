# SantriFlow 🕌

**Aplikasi Manajemen Pondok Pesantren** — kelola perpulangan santri, pembayaran, dan keuangan pondok dengan mudah.

## Fitur

- ✅ **Manajemen Santri** — data santri, kamar, kontak wali
- ✅ **Perpulangan** — rencana pulang, tracking kepulangan, batas kembali
- ✅ **Pembayaran** — catat pembayaran santri per periode
- ✅ **Keuangan** — pemasukan & pengeluaran pondok
- ✅ **Laporan** — export PDF & Excel semua data
- ✅ **Halaman Public** — wali santri bisa cek data anak
- ✅ **Branding Kustom** — ganti nama pondok, tagline, kontak via panel admin
- ✅ **Multi-periode** — atur periode perpulangan bergulir

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS 4 |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Deploy | Vercel (atau VPS) |

## Cara Install (Lokal)

```bash
# 1. Clone / copy project
# 2. Install dependencies
cd santriflow
npm run install:all

# 3. Setup database PostgreSQL
#    Buat database, lalu:
npm run seed

# 4. Jalankan development
npm run dev
# Frontend: http://localhost:5173
# Backend: http://localhost:8000

# 5. Login
#    Email: admin@ponpes.com
#    Pass: admin123
```

## Cara Deploy ke Vercel

1. Push ke GitHub
2. Import repo ke Vercel
3. Set env vars di Vercel:
   - `POSTGRES_URL` — connection string PostgreSQL (Neon/Railway/Supabase)
   - `DATABASE_URL` — sama
   - `JWT_SECRET` — ganti dengan secret random
4. Deploy! 🚀

## Kustomisasi

Setelah login, buka **Pengaturan > Branding Pondok** untuk ubah:
- Nama pondok
- Tagline
- Alamat, telepon, email, website
- Nama singkat (muncul di sidebar)

## Struktur Folder

```
santriflow/
├── api/                 # Vercel serverless entry
├── backend/
│   └── src/
│       ├── config/      # Database, brand config
│       ├── middleware/  # Auth JWT
│       ├── routes/      # API endpoints
│       ├── app.js       # Express app
│       ├── index.js     # Server entry
│       └── seed.js      # Data awal
├── web/
│   └── src/
│       ├── api/         # API client
│       ├── components/  # Shared components
│       ├── context/     # Auth, Brand context
│       ├── lib/         # Utils, export
│       └── pages/       # Halaman aplikasi
├── docs/                # Dokumentasi teknis
└── package.json         # Root scripts
```

## Harga & Lisensi

SantriFlow adalah aplikasi siap-pakai untuk pondok pesantren.
Untuk informasi lisensi dan harga, hubungi pengembang.
