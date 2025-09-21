/*
  Full seed: populate orders, order_details, payments, piutang to reach ~100 rows each (90-120).
  Usage: node scripts/seed_orders_full.js
  WARNING: This will create data in the configured DB. Intended for dev/test only.
*/

const models = require('../src/models');

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

async function run() {
  await models.sequelize.authenticate();
  console.log('Connected to DB');

  const products = await models.Product.findAll();
  if (!products || products.length === 0) {
    console.error('No products found - aborting demo');
    process.exit(1);
  }

  const customers = await models.Customer.findAll();
  if (!customers || customers.length === 0) {
    console.error('No customers found - aborting; create customers first');
    process.exit(1);
  }

  // target counts
  const TARGET_MIN = 90;
  const TARGET_MAX = 120;

  // helper to count
  async function counts() {
    const orderCount = await models.Order.count();
    const orderDetailsCount = await models.OrderDetail.count();
    const paymentsCount = await models.Payment.count();
    const piutangCount = await models.Piutang.count();
    return { orderCount, orderDetailsCount, paymentsCount, piutangCount };
  }

  const cur = await counts();
  console.log('Current counts:', cur);

  // We'll create batches of orders until orderCount in [TARGET_MIN, TARGET_MAX]
  // and likewise try to create payments and piutang so each reaches that range.

  const createdSummary = { orders:0, orderDetails:0, payments:0, piutangs:0 };

  while (true) {
    const c = await counts();
    if (c.orderCount >= TARGET_MIN && c.paymentsCount >= TARGET_MIN && c.piutangCount >= TARGET_MIN) break; // all good

    // pick a random customer
    const customer = pick(customers);
    // create between 1..3 orders for this customer in this iteration
    const createOrders = randInt(1, 3);
    for (let i = 0; i < createOrders; i++) {
      // stop early if we exceeded targets
      const nowCounts = await counts();
      if (nowCounts.orderCount >= TARGET_MAX && nowCounts.paymentsCount >= TARGET_MAX && nowCounts.piutangCount >= TARGET_MAX) break;

      // build order
      const itemCount = randInt(1, 4);
      let total = 0;
      const chosen = [];
      for (let k = 0; k < itemCount; k++) {
        const p = pick(products);
        const qty = randInt(1, 8);
        const harga = Number(p.harga_per_pcs || p.harga || 10000);
        const subtotal = qty * harga;
        chosen.push({ p, qty, harga, subtotal });
        total += subtotal;
      }
      const no_trx = `FULL-TRX-${Date.now()}-${Math.floor(Math.random()*10000)}`;
      const order = await models.Order.create({ id_customer: customer.id_customer, no_transaksi: no_trx, tanggal_order: new Date(), status_urgensi: 'normal', total_bayar: total, dp_bayar: 0, status_bayar: 'belum_lunas', tanggal_jatuh_tempo: new Date(Date.now()+7*24*3600*1000), link_invoice: '', link_drive: '', status_bot: 'pending', status_order: 'pending', created_at: new Date(), updated_at: new Date(), total_harga: total, status: 'pending' });
      createdSummary.orders++;

      // order details
      for (const it of chosen) {
        await models.OrderDetail.create({ id_order: order.id_order, id_produk: it.p.id_produk || it.p.id, quantity: it.qty, harga_satuan: it.harga, subtotal_item: it.subtotal, created_at: new Date(), updated_at: new Date() });
        createdSummary.orderDetails++;
      }

      // Possibly create piutang (if total > 0)
      if (total > 0) {
        await models.Piutang.create({ id_customer: customer.id_customer, jumlah_piutang: total, paid: 0.00, tanggal_piutang: new Date(), status: 'belum_lunas', created_at: new Date(), updated_at: new Date() });
        createdSummary.piutangs++;
      }

      // create 0..2 payments per order
      const paymentsCount = randInt(0, 2);
      for (let p = 0; p < paymentsCount; p++) {
        const isVerified = Math.random() < 0.7; // more verified
        const nominal = isVerified ? Math.floor(Math.random() * total) : 0;
        const tipe = isVerified ? (Math.random()<0.5 ? 'dp' : 'pelunasan') : 'dp';
        const status = isVerified ? 'verified' : 'menunggu_verifikasi';
        await models.Payment.create({ no_transaksi: order.no_transaksi, no_hp: customer.no_hp, nominal, bukti: isVerified ? `https://example.com/bukti-${Math.floor(Math.random()*100000)}.jpg` : null, tipe, status, created_at: new Date(), updated_at: new Date() });
        createdSummary.payments++;
      }

      // quick break conditions
      const newCounts = await counts();
      if (newCounts.orderCount >= TARGET_MAX && newCounts.paymentsCount >= TARGET_MAX && newCounts.piutangCount >= TARGET_MAX) break;
    }

    // stop if we've created a lot to avoid infinite loop
    if (createdSummary.orders > 1000) break;
  }

  console.log('Created summary:', createdSummary);
  console.log('Final counts:', await (async ()=>{
    const x = await counts(); return x;
  })());

  process.exit(0);
}

run().catch(e=>{ console.error(e); process.exit(1); });
