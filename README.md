# Module 3: Backend — Node.js REST API dengan PostgreSQL

README pembelajaran berdasarkan project ini. Project menggunakan pola **route → controller → validation → service → repository → database** dan memiliki autentikasi JWT, PostgreSQL, Redis, upload lokal, serta Cloudinary.

## 1. Tujuan Pembelajaran

- Memahami alur request Express dan HTTP status code.
- Membuat CRUD menu dengan PostgreSQL.
- Memvalidasi body dan query menggunakan Zod.
- Menerapkan signup, signin, JWT access token, refresh-token rotation, dan logout.
- Memahami upload file menggunakan Multer, penyimpanan lokal, dan Cloudinary.
- Menggunakan Redis sebagai cache daftar gambar.
- Mendiagnosis error dari aplikasi, PostgreSQL, Redis, dan layanan eksternal.

## 2. Struktur Project

```text
server.js                         # entry point dan route umum
config/
	db.config.js                     # pool PostgreSQL
	redis.config.js                  # koneksi Redis
	cloudinary.config.js             # kredensial Cloudinary
	multer.config.js                 # upload lokal dan memory
modules/menu/                      # CRUD menu
modules/auth/                      # autentikasi dan profil user
middleware/                        # auth, role authorization, logging
utils/                             # JWT, cookie, invalidasi cache
storage/public/                    # file upload lokal
db.sql                             # definisi tabel
compose.yaml                       # Redis Docker
.env.example                       # template environment variable
```

## 3. Instalasi dan Konfigurasi

```bash
node --version
npm --version
npm install
cp .env.example .env       # Linux/macOS; salin manual di Windows
npm run dev                 # atau npm start sesuai package.json
```

Minimal `.env`:

```env
PORT=8000
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
JWT_SECRET=ganti-dengan-rahasia-kuat
JWT_REFRESH_SECRET=ganti-dengan-rahasia-kuat
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_EXPIRES=7d
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=default
REDIS_PASSWORD=
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

Jangan commit `.env`. Kredensial yang pernah tersebar harus segera di-rotate. Gunakan `http://localhost:8000` sebagai base URL.

### Menjalankan Docker Compose

Docker adalah platform untuk menjalankan aplikasi di dalam **container**, yaitu lingkungan terisolasi yang berisi aplikasi dan dependensinya. `Docker Compose` digunakan untuk menjalankan beberapa container berdasarkan konfigurasi pada `compose.yaml`. Pada project ini, Compose digunakan untuk menjalankan Redis.

1. Install **Docker Desktop** dari [docker.com](https://www.docker.com/products/docker-desktop/), lalu jalankan Docker Desktop.
2. Buat akun Docker Hub jika belum memilikinya, kemudian login melalui Docker Desktop atau terminal:

	```bash
	docker login
	```

	Masukkan username dan password/token Docker Hub ketika diminta.

3. Buka terminal, masuk ke folder project ini, lalu jalankan:

	```bash
	cd "./CAMP5-backend"
	docker compose up -d
	```

	Opsi `-d` menjalankan container di background. Periksa statusnya dengan:

	```bash
	docker compose ps
	```

	Untuk menghentikan sementara container tanpa menghapusnya:

	```bash
	docker compose stop
	```

	Jalankan kembali container yang sudah dihentikan dengan:

	```bash
	docker compose start
	```

	Jika sudah selesai dan ingin menghapus container serta network Compose:

	```bash
	docker compose down
	```

	`docker compose down -v` juga menghapus volume, sehingga data yang tersimpan pada volume dapat ikut terhapus. Gunakan opsi ini hanya jika data Redis tidak diperlukan lagi.

## 4. Penjelasan `server.js` dan Middleware

Urutan middleware penting: `dotenv` memuat konfigurasi, lalu CORS, Helmet, cookie parser, dan `express.json()` memproses request sebelum route dijalankan.

- **CORS:** saat ini mengizinkan origin `localhost:5173`, credentials, dan method CRUD. Pada browser, origin biasanya perlu ditulis lengkap, misalnya `http://localhost:5173`.
- **Helmet:** menambahkan HTTP security headers.
- **cookie-parser:** membaca cookie refresh token jika digunakan.
- **express.json():** membaca body JSON. Upload file tetap menggunakan `multipart/form-data` melalui Multer.
- **`/` dan `/example`:** route pengecekan server.
- **static `/image`:** mempublikasikan `storage/public` sebagai URL gambar lokal.

Request menu berjalan melalui `menu.routes.js`. Controller menangani HTTP, service menerapkan aturan bisnis, repository menjalankan query parameterized. Dengan demikian SQL tidak dicampur ke controller.

## 5. Endpoint Menu

Base path: `/api/v1/menu`

| Method | URL | Auth | Keterangan |
|---|---|---|---|
| GET | `/api/v1/menu` | Tidak | Semua menu yang belum dihapus |
| GET | `/api/v1/menu/:id` | Tidak | Satu menu; `id` BIGINT |
| GET | `/api/v1/menu/menu-paginate?page=1&limit=10` | Tidak | Pagination, page minimal 1, limit 1–100 |
| POST | `/api/v1/menu` | JWT + admin | Membuat menu |
| PUT | `/api/v1/menu/:id` | JWT + admin | Mengubah menu |
| DELETE | `/api/v1/menu/:id` | Saat ini tidak diwajibkan | Soft delete menu |

Body POST/PUT:

```json
{
	"name": "Nasi Goreng",
	"description": "Menu utama",
	"price": 25000,
	"is_available": true
}
```

`name` minimal 3 karakter, `price` harus number positif, dan `is_available` boolean. Header admin: `Authorization: Bearer <accessToken>`. Kesalahan validasi saat ini dikembalikan sebagai `400`; data tidak ditemukan juga dipetakan controller ke `400`, sehingga dapat diperbaiki menjadi `404`.

Contoh:

```bash
curl http://localhost:8000/api/v1/menu
curl "http://localhost:8000/api/v1/menu/menu-paginate?page=2&limit=5"
curl -X POST http://localhost:8000/api/v1/menu -H "Content-Type: application/json" -H "Authorization: Bearer TOKEN" -d '{"name":"Nasi Goreng","price":25000}'
curl -X PUT http://localhost:8000/api/v1/menu/1 -H "Content-Type: application/json" -H "Authorization: Bearer TOKEN" -d '{"name":"Nasi Goreng Spesial","price":30000}'
curl -X DELETE http://localhost:8000/api/v1/menu/1
```

## 6. Autentikasi dan User

Base path: `/api/v1/auth` (route detail berada di `modules/auth/auth.routes.js`). Alur yang dipelajari:

1. **Signup:** validasi name/email/password, cek email, hash password dengan bcrypt, simpan user, lalu buat access dan refresh token.
2. **Signin:** cari email, bandingkan password hash, lalu buat session.
3. **Refresh:** refresh token lama dicari, dihapus, kemudian diganti token baru (rotation).
4. **Profile:** middleware JWT mengambil user ID, lalu service mengambil data user.
5. **Update profile:** password baru di-hash sebelum disimpan.
6. **Logout:** hapus satu refresh token atau seluruh session user.

Schema signup/signin mensyaratkan email valid dan password minimal 6 karakter. Periksa `auth.routes.js` untuk method, URL, dan nama field aktual sebelum menguji; kirim access token sebagai `Bearer` kecuali route tersebut secara eksplisit memakai cookie.

## 7. Upload Gambar

| Method | URL | Field multipart | Penyimpanan |
|---|---|---|---|
| POST | `/api/v1/image-upload` | `image` | `storage/public`, metadata PostgreSQL |
| GET | `/api/v1/all-image` | - | Redis cache atau PostgreSQL |
| POST | `/api/v1/image-upload-cloudinary` | `image` | Cloudinary, metadata PostgreSQL |

File hanya JPEG/PNG/GIF dan maksimal 1 MB. Upload lokal menghasilkan URL `http://localhost:8000/image/<filename>`. Upload Cloudinary menggunakan memory storage, mengirim buffer melalui `upload_stream`, lalu menyimpan `public_id` dan `secure_url` ke tabel `images`.

```bash
curl -X POST http://localhost:8000/api/v1/image-upload -F "image=@./gambar.png"
curl -X POST http://localhost:8000/api/v1/image-upload-cloudinary -F "image=@./gambar.png"
curl http://localhost:8000/api/v1/all-image
```

Jika insert metadata gagal, upload lokal menghapus file; upload Cloudinary mencoba menghapus asset yang sudah terlanjur dibuat. Cache `images:all` dihapus setelah upload berhasil.

## 8. PostgreSQL dan `db.sql`

Tabel utama:

- `menus`: CRUD menu dan soft delete melalui `is_deleted`.
- `users`: akun, role (`user`/`admin`), provider, dan soft delete.
- `refresh_tokens`: token session dengan foreign key ke `users`.
- `images`: metadata file dan provider penyimpanan.

Jalankan schema pada database yang benar, lalu cek:

```bash
psql "$DATABASE_URL" -f db.sql
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM menus;"
```

Catatan: `db.sql` memerlukan extension `pgcrypto` untuk `gen_random_uuid()` (`CREATE EXTENSION IF NOT EXISTS pgcrypto;`) dan setiap statement SQL sebaiknya diakhiri `;`.

### Troubleshooting PostgreSQL

- **`ECONNREFUSED`:** PostgreSQL tidak aktif atau host/port salah.
- **`password authentication failed`:** user/password salah; uji langsung dengan `psql`.
- **`database does not exist`:** buat database atau perbaiki `DATABASE_URL`.
- **`relation ... does not exist`:** jalankan `db.sql` pada database yang sama dengan aplikasi.
- **`function gen_random_uuid does not exist`:** aktifkan extension `pgcrypto`.
- **SSL/cloud error:** gunakan query string SSL dari provider; jangan menghapus `sslmode=require` tanpa alasan.
- **Data menu tidak muncul:** repository memfilter `is_deleted = false`; periksa nilai tersebut.
- **Query gagal tetapi error kurang jelas:** lihat log server dan uji query dengan `psql`; jangan mengembalikan detail SQL ke client production.

## 9. Redis dan Cache

Redis dijalankan melalui Docker:

```bash
docker compose up -d redis
docker compose ps
redis-cli -h localhost -p 6379 ping
```

`config/redis.config.js` membuat client saat aplikasi di-load. Endpoint `GET /api/v1/all-image` membaca key `images:all`; jika kosong, query PostgreSQL dan menyimpan hasil selama 60 detik. Fungsi `invalidateImagesCache()` menghapus key setelah upload.

### Troubleshooting Redis

- **`ECONNREFUSED 127.0.0.1:6379`:** jalankan container dan pastikan `REDIS_HOST=localhost`, `REDIS_PORT=6379`.
- **Authentication error:** sesuaikan username/password dengan Redis provider; Redis lokal sering tidak memakai password.
- **Aplikasi berhenti saat startup:** konfigurasi melakukan `await redisClient.connect()`; periksa Redis sebelum menjalankan server.
- **Data lama muncul:** cek key dengan `redis-cli GET images:all`, tunggu TTL 60 detik, atau jalankan `DEL images:all`.
- **Cloud Redis:** gunakan host, port, TLS, dan format password dari provider; konfigurasi socket saat ini perlu disesuaikan jika provider mewajibkan TLS.

## 10. Cloudinary

`cloudinary.config.js` membaca tiga environment variable. Pastikan cloud name, API key, dan API secret berasal dari account yang sama. Jangan menaruh secret pada frontend atau commit ke repository.

### Troubleshooting Cloudinary

- **`Invalid API Key`/signature error:** periksa tiga variable dan restart server setelah mengubah `.env`.
- **Upload timeout/network error:** uji koneksi internet, status Cloudinary, dan ukuran file.
- **Gambar tidak tampil:** gunakan `secure_url`, periksa resource type `image`, dan cek asset di dashboard.
- **DB gagal setelah upload:** server mencoba cleanup asset; bila gagal, hapus orphan asset dari dashboard berdasarkan `public_id`.

## 11. Checklist Debugging

1. Pastikan `.env` terbaca dan server berjalan pada port yang benar.
2. Pastikan PostgreSQL schema dan Redis tersedia sebelum import config.
3. Uji `/` lalu endpoint tanpa auth.
4. Untuk endpoint protected, cek format `Authorization: Bearer ...`, JWT secret, expiry, dan role user.
5. Untuk JSON, gunakan `Content-Type: application/json`; untuk file gunakan `multipart/form-data` dengan field `image`.
6. Periksa log terminal, status code, response, PostgreSQL, Redis, dan Cloudinary secara terpisah.
7. Bedakan `400` (input), `401` (token), `403` (role), `404` (resource), dan `500` (server/integrasi).

## 12. Catatan Perbaikan untuk Latihan

- Tambahkan middleware error terpusat dan ubah resource tidak ditemukan menjadi `404`.
- Lindungi endpoint DELETE dengan `auth` dan `authorizeRoles(['admin'])`.
- Validasi `id` sebelum query dan gunakan response error yang konsisten.
- Tambahkan pengecekan expiry pada refresh token.
- Gunakan origin CORS lengkap (`http://localhost:5173`) dan environment berbeda untuk development/production.
- Tambahkan `.gitignore` untuk `.env`, `storage/public`, log, dan dependency.

