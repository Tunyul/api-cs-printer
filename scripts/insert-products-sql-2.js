const { sequelize } = require('../src/models');

const sql = `
INSERT INTO products (kategori, nama_produk, bahan, finishing, ukuran_standar, harga_per_m2, harga_per_pcs, waktu_proses, stock, created_at, updated_at)
VALUES
('Printer', 'Print Document A4', 'Kertas HVS', 'Matte', 'A4 (210x297mm)', 0.00, 1500.00, '1 hari', 100, NOW(), NOW()),
('Printer', 'Print Document A3', 'Kertas HVS', 'Matte', 'A3 (297x420mm)', 0.00, 3000.00, '1 hari', 100, NOW(), NOW()),
('Printer', 'Print Brochure 10x15cm', 'Kertas Art', 'Glossy', '10x15cm', 0.00, 375.00, '2 hari', 50, NOW(), NOW()),
('Printer', 'Print Poster 50x70cm', 'Kertas Poster', 'Matte', '50x70cm', 0.00, 875.00, '3 hari', 30, NOW(), NOW()),
('Printer', 'Print Banner 100x50cm', 'Kertas Banner', 'Glossy', '100x50cm', 25000.00, 0.00, '3 hari', 20, NOW(), NOW()),
('Printer', 'Print Business Card', 'Kertas PVC', 'Matte', '90x50mm', 0.00, 12500.00, '1 hari', 200, NOW(), NOW()),
('Printer', 'Print Stiker 10x10cm', 'Plastik Stiker', 'Glossy', '10x10cm', 0.00, 250.00, '1 hari', 150, NOW(), NOW()),
('Printer', 'Print Kartu Nama', 'Kertas PVC', 'Matte', '90x50mm', 0.00, 12500.00, '1 hari', 200, NOW(), NOW()),
('Printer', 'Print Flier A4', 'Kertas Art', 'Matte', 'A4 (210x297mm)', 0.00, 750.00, '1 hari', 80, NOW(), NOW()),
('Printer', 'Print Kalender 20x30cm', 'Kertas Karton', 'Matte', '20x30cm', 0.00, 1500.00, '4 hari', 40, NOW(), NOW());
`;

(async () => {
  try {
    console.log('Running SQL insert for 10 products...');
    await sequelize.query(sql);
    const [rows] = await sequelize.query("SELECT id_produk, kategori, nama_produk, harga_per_m2, harga_per_pcs, stock FROM products ORDER BY id_produk DESC LIMIT 10");
    console.log('Inserted rows (latest 10):');
    console.table(rows);
    const [countRes] = await sequelize.query('SELECT COUNT(*) as cnt FROM products');
    console.log('Total products count:', countRes[0].cnt);
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('Insert failed:', err);
    try { await sequelize.close(); } catch (e) {}
    process.exit(1);
  }
})();