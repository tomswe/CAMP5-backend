# Module 3: Backend — Node.js REST API with PostgreSQL

README materi untuk mempelajari pembuatan REST API menggunakan Node.js dan PostgreSQL.

## Tujuan Pembelajaran

- Memahami cara kerja backend, HTTP, dan REST API.
- Membuat endpoint CRUD dengan Node.js dan Express.
- Menghubungkan API ke database PostgreSQL.
- Memvalidasi input dan menangani error.
- Menguji endpoint menggunakan Postman atau REST client lain.

## Teknologi yang Digunakan

- Node.js dan npm
- Express.js
- PostgreSQL
- Postman (opsional, untuk pengujian API)

## Persiapan

Pasang Node.js dan PostgreSQL, lalu buat database untuk latihan. Simpan konfigurasi koneksi di file `.env` dan jangan commit kredensial ke repositori.

Contoh konfigurasi:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nama_database
DB_USER=nama_user
DB_PASSWORD=password
```

atau
```
PORT=8000
DATABASE_URL=your_cloud_postgres_url_connection_string
```

## Menjalankan Aplikasi

Di folder proyek, instal dependensi:

```bash
npm install
```

Jalankan aplikasi menggunakan script yang tersedia di `package.json`, misalnya:

```bash
npm run dev
```

## Pokok Materi

1. Struktur proyek Node.js dan Express.
2. Routing dan metode HTTP: `GET`, `POST`, `PUT`/`PATCH`, dan `DELETE`.
3. Request, response, dan format JSON.
4. Koneksi serta operasi data pada PostgreSQL.
5. Validasi data dan penanganan error.
6. Pengujian endpoint dan praktik keamanan dasar.

