/*
  Create 25 orders with status_order: 'selesai', with order_details, a verified payment covering the order, and a piutang marked 'lunas'.
  Usage: node scripts/add_25_selesai_orders.js
*/

const models = require('../src/models');

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

async function run() {
  await models.sequelize.authenticate();
  console.log('Connected to DB');

  const products = await models.Product.findAll();
  const customers = await models.Customer.findAll();
  if (!products.length || !customers.length) {
    console.error('Need products and customers present');
    process.exit(1);
  }

  const created = [];
  for (let i = 0; i < 25; i++) {
    const customer = pick(customers);
    const itemsCount = randInt(1,4);
    let total = 0;
    const chosen = [];
    for (let k = 0; k < itemsCount; k++) {
      const p = pick(products);
      const qty = randInt(1,6);
      const harga = Number(p.harga_per_pcs || p.harga || 10000);
      const subtotal = qty * harga;
      chosen.push({p, qty, harga, subtotal});
      total += subtotal;
    }
    const no_trx = `DONE-TRX-${Date.now()}-${i}-${Math.floor(Math.random()*1000)}`;
    const order = await models.Order.create({ id_customer: customer.id_customer, no_transaksi: no_trx, tanggal_order: new Date(), status_urgensi: 'normal', total_bayar: total, dp_bayar: 0, status_bayar: 'lunas', tanggal_jatuh_tempo: new Date(), link_invoice: '', link_drive: '', status_bot: 'selesai', status_order: 'selesai', created_at: new Date(), updated_at: new Date(), total_harga: total, status: 'selesai' });

    for (const it of chosen) {
      await models.OrderDetail.create({ id_order: order.id_order, id_produk: it.p.id_produk || it.p.id, quantity: it.qty, harga_satuan: it.harga, subtotal_item: it.subtotal, created_at: new Date(), updated_at: new Date() });
    }

    // create a payment that fully covers the order and mark verified
    await models.Payment.create({ no_transaksi: order.no_transaksi, no_hp: customer.no_hp, nominal: total, bukti: `https://example.com/bukti-done-${i}.jpg`, tipe: 'pelunasan', status: 'verified', created_at: new Date(), updated_at: new Date() });

    // create a piutang entry but mark paid and status 'lunas'
    await models.Piutang.create({ id_customer: customer.id_customer, jumlah_piutang: 0, paid: total, tanggal_piutang: new Date(), status: 'lunas', created_at: new Date(), updated_at: new Date() });

    created.push(order.get({ plain: true }));
  }

  console.log('Created orders count:', created.length);
  process.exit(0);
}

run().catch(e=>{ console.error(e); process.exit(1); });
