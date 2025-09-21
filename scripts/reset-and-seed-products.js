const models = require('../src/models');

const curated = [
  { kategori: 'Banner', nama_produk: 'Banner PVC 1m2', bahan: 'PVC', finishing: 'Glossy', ukuran_standar: '1m2', harga_per_m2: 25000, harga_per_pcs: 25000, waktu_proses: '1 hari', stock: 100 },
  { kategori: 'Sticker', nama_produk: 'Sticker Vinyl 1m2', bahan: 'Vinyl', finishing: 'Matte', ukuran_standar: '1m2', harga_per_m2: 25000, harga_per_pcs: 25000, waktu_proses: '1 hari', stock: 200 },
  { kategori: 'Poster', nama_produk: 'Poster Art Paper 1m2', bahan: 'Art Paper', finishing: 'Laminasi', ukuran_standar: '1m2', harga_per_m2: 25000, harga_per_pcs: 25000, waktu_proses: '1 hari', stock: 150 },
  { kategori: 'Kanvas', nama_produk: 'Kanvas Print 1m2', bahan: 'Kanvas', finishing: 'Kanvas Laminasi', ukuran_standar: '1m2', harga_per_m2: 25000, harga_per_pcs: 25000, waktu_proses: '2 hari', stock: 50 },
  { kategori: 'PVC', nama_produk: 'PVC Board 1m2', bahan: 'PVC Board', finishing: 'Cutting', ukuran_standar: '1m2', harga_per_m2: 25000, harga_per_pcs: 25000, waktu_proses: '2 hari', stock: 80 },
  { kategori: 'Kartu', nama_produk: 'Kartu Nama 1m2-equivalent', bahan: 'Art Paper', finishing: 'UV', ukuran_standar: '1m2', harga_per_m2: 25000, harga_per_pcs: 25000, waktu_proses: '1 hari', stock: 500 },
  { kategori: 'Spanduk', nama_produk: 'Spanduk Outdoor 1m2', bahan: 'Mesh', finishing: 'Edge Sewing', ukuran_standar: '1m2', harga_per_m2: 25000, harga_per_pcs: 25000, waktu_proses: '2 hari', stock: 60 },
  { kategori: 'X-banner', nama_produk: 'X-Banner 1m2', bahan: 'PVC', finishing: 'X-Stand', ukuran_standar: '1m2', harga_per_m2: 25000, harga_per_pcs: 25000, waktu_proses: '1 hari', stock: 40 },
  { kategori: 'Stiker', nama_produk: 'Stiker Transparan 1m2', bahan: 'Transparent Vinyl', finishing: 'Clear', ukuran_standar: '1m2', harga_per_m2: 25000, harga_per_pcs: 25000, waktu_proses: '1 hari', stock: 120 },
  { kategori: 'Kain', nama_produk: 'Kain Sablon 1m2', bahan: 'Cotton', finishing: 'Sablon', ukuran_standar: '1m2', harga_per_m2: 25000, harga_per_pcs: 25000, waktu_proses: '3 hari', stock: 30 }
];

async function run() {
  try {
    await models.sequelize.authenticate();
    console.log('DB connected');
    await models.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    await models.sequelize.query('TRUNCATE TABLE products;');
    await models.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

    const now = new Date();
    for (const p of curated) {
      await models.Product.create({ ...p, created_at: now, updated_at: now });
    }

    const rows = await models.Product.findAll({ order: [['id_produk','ASC']] });
    console.log('Inserted products:');
    rows.forEach(r => console.log(r.id_produk, r.kategori, r.nama_produk, r.harga_per_m2.toString()));
    process.exit(0);
  } catch (err) {
    console.error('error', err.message || err);
    process.exit(1);
  }
}

run();
