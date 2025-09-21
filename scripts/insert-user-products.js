/* Insert products from user's SQL payload into `products` table.
Run: node scripts/insert-user-products.js
*/

const models = require('../src/models');

const rows = [
  ['Banner','Spanduk Outdoor','Flexi 280 gsm','Laminasi Glossy','1x2 m',35000.00,70000.00,'2 hari',50],
  ['Banner','X-Banner','Flexi 260 gsm','Tanpa Laminasi','60x160 cm',null,85000.00,'1 hari',40],
  ['Kartu Nama','Kartu Nama Premium','Art Carton 260 gsm','Laminasi Doff','9x5.5 cm',null,45000.00,'2 hari',100],
  ['Kartu Nama','Kartu Nama Standar','Art Carton 210 gsm','Tanpa Laminasi','9x5.5 cm',null,30000.00,'1 hari',120],
  ['Poster','Poster A3','Art Paper 150 gsm','Laminasi Glossy','29.7x42 cm',25000.00,15000.00,'1 hari',70],
  ['Poster','Poster A2','Art Paper 150 gsm','Tanpa Laminasi','42x59.4 cm',35000.00,25000.00,'2 hari',60],
  ['Brosur','Brosur Lipat 3','Art Paper 120 gsm','Full Color','A4 (21x29.7 cm)',null,1500.00,'2 hari',500],
  ['Stiker','Stiker Vinyl','Vinyl Glossy','Die Cut','Custom',65000.00,5000.00,'3 hari',200],
  ['Stiker','Stiker Transparan','Vinyl Transparan','Cutting','Custom',70000.00,6000.00,'3 hari',150],
  ['Kalender','Kalender Meja','Art Carton 260 gsm','Spiral Binding','15x21 cm',null,30000.00,'4 hari',80]
];

(async () => {
  try {
    await models.sequelize.authenticate();
    console.log('Inserting user products...');
    for (const r of rows) {
      const [kategori,nama_produk,bahan,finishing,ukuran_standar,harga_per_m2,harga_per_pcs,waktu_proses,stock] = r;
      await models.Product.create({ kategori, nama_produk, bahan, finishing, ukuran_standar, harga_per_m2, harga_per_pcs, waktu_proses, stock });
    }
    const total = await models.Product.count();
    console.log('Total products after insert:', total);
    const list = await models.Product.findAll({ limit: 20 });
    console.table(list.map(r => ({ id_produk: r.id_produk, nama_produk: r.nama_produk, harga_per_m2: r.harga_per_m2, harga_per_pcs: r.harga_per_pcs, ukuran_standar: r.ukuran_standar })));
    process.exit(0);
  } catch (e) {
    console.error('Error', e);
    process.exit(1);
  }
})();
