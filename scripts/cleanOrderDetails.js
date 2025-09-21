const mysql = require('mysql2/promise');

async function cleanOrderDetails() {
  const connection = await mysql.createConnection({
    host: 'localhost', // ganti sesuai config
    user: 'root',      // ganti sesuai config
    password: '',      // ganti sesuai config
    database: 'cukong_db'
  });

  // Cari data order_details yang id_produk-nya tidak valid
  const [rows] = await connection.execute(`
    SELECT id FROM order_details WHERE id_produk NOT IN (SELECT id_produk FROM products)
  `);

  if (rows.length === 0) {
    console.log('Tidak ada data order_details yang bermasalah.');
    await connection.end();
    return;
  }

  // Hapus data bermasalah
  const ids = rows.map(r => r.id);
  await connection.execute(`
    DELETE FROM order_details WHERE id IN (${ids.join(',')})
  `);

  console.log(`Berhasil menghapus ${ids.length} data order_details yang tidak valid.`);
  await connection.end();
}

cleanOrderDetails().catch(console.error);
