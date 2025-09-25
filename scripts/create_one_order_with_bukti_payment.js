// scripts/create_one_order_with_bukti_payment.js
// Run with: node scripts/create_one_order_with_bukti_payment.js

const models = require('../src/models');

function generateTransactionNumber(name) {
  const date = new Date();
  const day = String(date.getDate()).padStart(2,'0');
  const month = String(date.getMonth()+1).padStart(2,'0');
  const year = date.getFullYear();
  const random = Math.floor(Math.random()*9000)+1000;
  const namePart = (name || 'CUST').split(' ')[0].toUpperCase().slice(0,6);
  return `TRX-${day}${month}${year}-${random}-${namePart}`;
}

async function ensureCustomer() {
  const c = await models.Customer.findOne();
  if (c) return c;
  return models.Customer.create({ nama: 'Bukti Customer', no_hp: '6287700000001', tipe_customer: 'reguler', batas_piutang: null, catatan: '', created_at: new Date(), updated_at: new Date() });
}

async function ensureProduct() {
  const p = await models.Product.findOne();
  if (p) return p;
  return models.Product.create({ kategori: 'Cetak', nama_produk: 'Produk Bukti', bahan: 'Karton', finishing: 'Gloss', ukuran_standar: 'pcs', harga_per_pcs: 100000, unit_area: null, waktu_proses: '1 hari', created_at: new Date(), updated_at: new Date(), stock: 5 });
}

async function main() {
  try {
    await models.sequelize.authenticate();
    console.log('DB connected');

    const customer = await ensureCustomer();
    const product = await ensureProduct();

    const buktiUrl = 'https://mediakonsumen.com/files/2024/10/Screenshot_20240920-030802-3.jpg';
    let created = null;

    await models.sequelize.transaction(async (t) => {
      const no_transaksi = generateTransactionNumber(customer.nama);
      const totalBayar = 200000; // reasonable default

      const order = await models.Order.create({ id_customer: customer.id_customer, no_transaksi, tanggal_order: new Date(), status_urgensi: 'normal', total_bayar: totalBayar, dp_bayar: 0, status_bayar: 'belum_lunas', tanggal_jatuh_tempo: new Date(Date.now()+7*24*3600*1000), link_invoice: '', link_drive: '', status_order: 'pending', total_harga: totalBayar, status: 'pending', catatan: '', status_bot: 'pending', created_at: new Date(), updated_at: new Date() }, { transaction: t });

      await models.OrderDetail.create({ id_order: order.id_order, id_produk: product.id_produk, quantity: 1, harga_satuan: totalBayar, subtotal_item: totalBayar, created_at: new Date(), updated_at: new Date() }, { transaction: t });

      // create payment with the bukti URL, mark as 'verified'
      const payment = await models.Payment.create({ id_order: order.id_order, id_customer: order.id_customer, no_transaksi: order.no_transaksi, no_hp: customer.no_hp, nominal: totalBayar, bukti: buktiUrl, tipe: 'pelunasan', status: 'verified', tanggal: new Date(), created_at: new Date(), updated_at: new Date() }, { transaction: t });

      // update order payment status
      await order.update({ dp_bayar: totalBayar, status_bayar: 'lunas', status: 'selesai', status_bot: 'selesai', updated_at: new Date() }, { transaction: t });

      created = { no_transaksi: order.no_transaksi, id_order: order.id_order, id_payment: payment.id_payment };
    });

    console.log('Created order with bukti payment:', created);
    process.exit(0);
  } catch (err) {
    console.error('Error creating order with bukti payment:', err);
    process.exit(1);
  }
}

main();
