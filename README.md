# api-cs-printer

RESTful API untuk manajemen transaksi, customer, produk, pembayaran, dan piutang.

## Fitur
- Autentikasi (login/register)
- CRUD Customer, Produk, Order, Payment, Piutang
- Dokumentasi API dengan Swagger
- Migrasi & Seeder database
- Middleware autentikasi

---

## Cara Instalasi & Menjalankan

### 1. Clone Repository
```sh
git clone https://github.com/Tunyul/api-cs-printer.git
cd api-cs-printer
```

### 2. Install Dependency
```sh
npm install
```

### 3. Konfigurasi Database
- Edit file `src/config/database.js` atau `config/config.json` sesuai database yang digunakan (MySQL/PostgreSQL).
- Contoh konfigurasi:
```json
{
  "development": {
    "username": "root",
    "password": "password",
    "database": "db_cukong",
    "host": "127.0.0.1",
    "dialect": "mysql"
  }
}
```

### 4. Migrasi & Seeder Database
```sh
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

### 5. Jalankan Server
```sh
npm start
```
Server berjalan di port 3000 (default). Bisa diubah di file `server.js`.

### 6. Akses Dokumentasi API
Buka browser ke:  
`http://localhost:3000/api-docs`

---

## Struktur Folder Penting
- `src/controllers/` : Logic endpoint
- `src/models/`      : Model database
- `src/routes/`      : Routing API
- `src/middleware/`  : Middleware (auth, dll)
- `src/config/`      : Konfigurasi database
- `migrations/`      : File migrasi database
- `seeders/`         : Seeder data awal
- `swagger/`         : Dokumentasi Swagger

---

## Catatan
- Pastikan Node.js & npm sudah terinstall.
- Untuk development, gunakan perintah `npm run dev` (jika tersedia nodemon).
- Untuk reset database: `npx sequelize-cli db:drop && npx sequelize-cli db:create && npx sequelize-cli db:migrate && npx sequelize-cli db:seed:all`

---

## Kontribusi
Pull request & issue sangat diterima!

---

## Lisensi
MIT

## Included scripts (public release)

This repository has been cleaned for public distribution. The following helper scripts remain in `scripts/`:

- `restart_server.sh` — restart the local server in this environment
- `test_order_webhook.js` — quick manual webhook tester (requires dotenv)
- `smoke_test_notif.js` — small notification smoke test
- `check_swagger.js`, `debug_swagger_annotations.js`, `find_bad_jsdoc.js` — swagger / docs helpers
- `seed_dummy_data.js`, `seed_uix.js`, `set_ukuran_from_harga_per_pcs.js`, `update_products_ukuran_standar.js` — selected seeding / migration helpers

Sensitive files (like `.env`) and runtime logs are excluded from the repository. If you need to run tests or scripts that require environment variables, create a local `.env` (ignored by git) with the needed values.

If you need additional scripts removed or restored, please open an issue or submit a PR.
