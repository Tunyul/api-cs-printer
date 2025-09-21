const models = require('../src/models');

async function run() {
  await models.sequelize.authenticate();
  console.log('DB connected');
  const products = await models.Product.findAll();
  for (const p of products) {
    const unit = p.pricing_unit || 'm2';
    const unitArea = Number(p.unit_area || 1);
    let hargaPcs = null;
    if (unit === 'm2') {
      hargaPcs = Number(p.harga_per_m2 || 0) * unitArea;
    } else if (unit === 'pcs') {
      // harga_per_m2 interpreted as per-pcs if pricing_unit == 'pcs'
      hargaPcs = Number(p.harga_per_m2 || 0);
    } else {
      // default fallback
      hargaPcs = Number(p.harga_per_m2 || 0) * unitArea;
    }
    await p.update({ harga_per_pcs: hargaPcs, updated_at: new Date() });
    console.log('updated', p.id_produk, p.nama_produk, '->', hargaPcs);
  }
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
