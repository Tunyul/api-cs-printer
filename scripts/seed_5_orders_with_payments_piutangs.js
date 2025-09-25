// scripts/seed_5_orders_with_payments_piutangs.js
// Run with: node scripts/seed_5_orders_with_payments_piutangs.js

const models = require('../src/models');

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateTransactionNumber(name) {
  const date = new Date();
  const day = String(date.getDate()).padStart(2,'0');
  const month = String(date.getMonth()+1).padStart(2,'0');
  const year = date.getFullYear();
  const random = Math.floor(Math.random()*9000)+1000;
  const namePart = (name || 'CUST').split(' ')[0].toUpperCase().slice(0,6);
  return `TRX-${day}${month}${year}-${random}-${namePart}`;
}

async function ensureOneProduct() {
  const p = await models.Product.findOne();
  if (p) return p;
  return models.Product.create({ kategori: 'Cetak', nama_produk: 'Produk Seed', bahan: 'Karton', finishing: 'Gloss', ukuran_standar: 'pcs', harga_per_pcs: 50000, unit_area: null, waktu_proses: '1 hari', created_at: new Date(), updated_at: new Date(), stock: 10 });
}

async function ensureCustomer() {
  // prefer existing customer, otherwise create one
  const c = await models.Customer.findOne();
  if (c) return c;
  const nama = 'Seed Customer';
  const no_hp = '6288800000000';
  return models.Customer.create({ nama, no_hp, tipe_customer: 'reguler', batas_piutang: null, catatan: '', created_at: new Date(), updated_at: new Date() });
}

async function main() {
  try {
    await models.sequelize.authenticate();
    console.log('DB connected');

    const product = await ensureOneProduct();
    const customer = await ensureCustomer();

    const created = [];

    // Use transaction to keep each order atomic
    for (let i=0;i<5;i++) {
      await models.sequelize.transaction(async (t) => {
        const no_transaksi = generateTransactionNumber(customer.nama + i);
        const tanggal_order = new Date();

        const order = await models.Order.create({ id_customer: customer.id_customer, no_transaksi, tanggal_order, status_urgensi: 'normal', total_bayar: 0, dp_bayar: 0, status_bayar: 'belum_lunas', tanggal_jatuh_tempo: new Date(Date.now()+7*24*3600*1000), link_invoice: '', link_drive: '', status_order: 'pending', total_harga: 0, status: 'pending', catatan: '', status_bot: 'pending', created_at: new Date(), updated_at: new Date() }, { transaction: t });

        // create 1-3 order details
        const detailCount = randInt(1,3);
        let totalHarga = 0;
        for (let d=0; d<detailCount; d++) {
          const qty = randInt(1,4);
          const harga_satuan = Number(product.harga_per_pcs || 0);
          const subtotal_item = harga_satuan * qty;
          await models.OrderDetail.create({ id_order: order.id_order, id_produk: product.id_produk, quantity: qty, harga_satuan, subtotal_item, created_at: new Date(), updated_at: new Date() }, { transaction: t });
          totalHarga += subtotal_item;
        }

        await order.update({ total_bayar: totalHarga, total_harga: totalHarga }, { transaction: t });

        // create a partial payment (30% DP)
        const dpNominal = Math.round(totalHarga * 0.3);
        const payment = await models.Payment.create({ id_order: order.id_order, id_customer: order.id_customer, no_transaksi: order.no_transaksi, no_hp: customer.no_hp, nominal: dpNominal, bukti: '', tipe: 'dp', status: 'verified', tanggal: new Date(), created_at: new Date(), updated_at: new Date() }, { transaction: t });

        // create piutang for remaining amount
        const remaining = Number(totalHarga) - Number(dpNominal);
        if (remaining > 0) {
          await models.Piutang.create({ id_customer: customer.id_customer, jumlah_piutang: remaining, paid: 0.00, tanggal_piutang: new Date(), status: 'belum_lunas', keterangan: `Piutang for ${order.no_transaksi}`, id_order: order.id_order, created_at: new Date(), updated_at: new Date() }, { transaction: t });
        }

        created.push({ order: order.no_transaksi, total: totalHarga, dp: dpNominal, remaining });
      });
    }

    console.log('Created 5 orders with payments and piutangs:');
    created.forEach((c,idx) => console.log(`${idx+1}. ${c.order} total=${c.total} dp=${c.dp} remaining=${c.remaining}`));

    process.exit(0);
  } catch (err) {
    console.error('Error seeding 5 orders:', err);
    process.exit(1);
  }
}

main();
