const models = require('../src/models');

async function run() {
  await models.sequelize.sync();
  const now = new Date();
  const products = [
    { kategori: 'Banner', nama_produk: 'Banner 1m2', bahan: 'PVC', finishing: 'Glossy', ukuran_standar: '1m2', harga_per_m2: 25000, harga_per_pcs: 25000, waktu_proses: '1 hari', stock: 100, created_at: now, updated_at: now },
    { kategori: 'Sticker', nama_produk: 'Sticker 1m2', bahan: 'Vinyl', finishing: 'Matte', ukuran_standar: '1m2', harga_per_m2: 25000, harga_per_pcs: 25000, waktu_proses: '1 hari', stock: 200, created_at: now, updated_at: now },
    { kategori: 'Kanvas', nama_produk: 'Kanvas 1m2', bahan: 'Kanvas', finishing: 'Laminasi', ukuran_standar: '1m2', harga_per_m2: 25000, harga_per_pcs: 25000, waktu_proses: '2 hari', stock: 50, created_at: now, updated_at: now }
  ];

  for (const p of products) {
    await models.Product.create(p);
  }
  const count = await models.Product.count();
  console.log('products count now:', count);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
