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
