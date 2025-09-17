## Contoh Endpoint Khusus Bot

### 1. Cek dan Buat User (Bot Only)
Endpoint: `/api/bot/customer`
Method: POST
Body:
```json
{
   "no_hp": "08123456789",
   "nama": "Budi"
}
```
Flow:
- Jika user belum ada, BE buat user baru.
- Jika user sudah ada, BE return data user.

### 2. Cek dan Buat Order (Bot Only)
Endpoint: `/api/bot/order`
Method: POST
Body:
```json
{
   "no_hp": "08123456789"
}
```
Flow:
- BE cek order terakhir user dengan status_bot.
- Jika ada order 'pending', return order itu.
- Jika semua order 'selesai', BE buat order baru dengan no_transaksi baru dan status_bot 'pending'.

### 3. Tambah Order Detail (Bot Only)
Endpoint: `/api/bot/order-detail`
Method: POST
Body:
```json
{
   "no_transaksi": "TRX20250911-001",
   "order_details": [
      { "id_product": 1, "qty": 2 },
      { "id_product": 2, "qty": 1 }
   ]
}
```
Flow:
- BE tambahkan order detail ke order dengan no_transaksi yang diberikan.

### Rekomendasi
- Endpoint di atas hanya bisa diakses oleh bot (gunakan API key, IP whitelist, atau token khusus).
- Validasi data dan response agar bot mudah parsing.
- Log aktivitas setiap request dari bot.
# Integrasi WA Bot (n8n) - Flow Backend

## Flow WA Bot di Backend
1. Customer kirim WA ke bot
2. Bot kirim request ke BE untuk cek user berdasarkan nomor HP
   - Endpoint: `/api/customers?phone=08123456789`
   - Jika user belum ada, BE buat user baru (endpoint create customer)
   - Jika user sudah ada, lanjut ke cek order
3. Cek order terakhir user
   - Endpoint: `/api/orders/customer/phone/{phone}`
   - BE cek order dengan status_bot:
     - Jika ada order dengan status_bot 'pending', gunakan order itu
     - Jika semua order status_bot 'selesai', BE buat order baru dengan no_transaksi baru (endpoint create order)
4. Jika perlu, buat order baru
   - Endpoint: `/api/orders/bot` (atau endpoint create order khusus bot)
   - BE generate no_transaksi baru dan buat order dengan status_bot 'pending'
5. Bot bisa lanjut proses order detail, pembayaran, dsb

## Rekomendasi Implementasi
- Pastikan endpoint cek user dan order sudah ada dan terdokumentasi di Swagger
- Endpoint create customer hanya untuk bot, bukan publik
- Endpoint create order untuk bot harus validasi status_bot dan generate no_transaksi unik
- Gunakan satu endpoint khusus untuk bot agar logika lebih mudah di-maintain
- Pastikan validasi data (no_hp, status_bot, dsb) di setiap endpoint
- Log aktivitas setiap kali bot membuat user/order baru (audit log)
- Gunakan response yang konsisten agar bot mudah parsing hasil dari BE

---
# Dokumentasi Instalasi & Setup Backend Cukong

## 1. Install Dependencies
Jalankan perintah berikut di folder backend:
```
npm install
```

## 2. Setup Database
- Buat database MySQL sesuai konfigurasi di project.
- Jalankan migration (jika menggunakan Sequelize CLI):
```
npx sequelize-cli db:migrate
```

## 3. Buat User Admin Pertama
Karena endpoint register hanya bisa diakses admin, buat user admin langsung di database.

### Cara manual:
1. Hash password admin dengan bcrypt:
   ```js
   const bcrypt = require('bcryptjs');
   bcrypt.hash('password_admin', 10, (err, hash) => console.log(hash));
   ```
2. Insert ke database (MySQL):
   ```sql
   INSERT INTO users (username, password, nama, role, createdAt, updatedAt)
   VALUES ('admin', '<hashed_password>', 'Admin', 'admin', NOW(), NOW());
   ```

## 4. Jalankan Aplikasi
```
npm run dev
```

## 5. Login Sebagai Admin
- Login ke endpoint `/api/auth/login` dengan username dan password admin.
- Dapatkan bearer token dari response.

## 6. Register User Baru (Opsional)
- Gunakan token admin untuk akses endpoint `/api/auth/register`.
- Hanya admin yang bisa membuat user baru.

## 7. Frontend Dashboard Admin
- Login dengan akun admin.
- Gunakan bearer token untuk akses API yang membutuhkan autentikasi.

## 8. Rekomendasi Keamanan
- Endpoint register hanya untuk admin (sudah diterapkan).
- Gunakan role pada user untuk membedakan akses.
- Validasi data register dan login.
- Gunakan bcrypt untuk hash password.
- Middleware JWT untuk semua endpoint sensitif.
- Audit log dan rate limiting (opsional, bisa ditambah).

---

Jika ingin menambah fitur keamanan lain, silakan konsultasi lebih lanjut!
