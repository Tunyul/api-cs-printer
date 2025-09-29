// scripts/create_one_order_with_zero_payment.js
// Run with: node scripts/create_one_order_with_zero_payment.js

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
  return models.Customer.create({ nama: 'ZeroPay Customer', no_hp: '6287700000000', tipe_customer: 'reguler', batas_piutang: null, catatan: '', created_at: new Date(), updated_at: new Date() });
}

async function ensureProduct() {
  const p = await models.Product.findOne();
  if (p) return p;
  return models.Product.create({ kategori: 'Cetak', nama_produk: 'Produk Zero Pay', bahan: 'Karton', finishing: 'Gloss', ukuran_standar: 'pcs', harga_per_pcs: 100000, unit_area: null, waktu_proses: '1 hari', created_at: new Date(), updated_at: new Date(), stock: 10 });
}

async function main() {
  try {
    await models.sequelize.authenticate();
    console.log('DB connected');

    const customer = await ensureCustomer();
    const product = await ensureProduct();

    await models.sequelize.transaction(async (t) => {
      const no_transaksi = generateTransactionNumber(customer.nama);
      const totalBayar = 1500000; // 1.500.000

      const order = await models.Order.create({ id_customer: customer.id_customer, no_transaksi, tanggal_order: new Date(), status_urgensi: 'normal', total_bayar: totalBayar, dp_bayar: 0, status_bayar: 'belum_lunas', tanggal_jatuh_tempo: new Date(Date.now()+7*24*3600*1000), link_invoice: '', link_drive: '', status_order: 'pending', total_harga: totalBayar, status: 'pending', catatan: '', status_bot: 'pending', created_at: new Date(), updated_at: new Date() }, { transaction: t });

      // add one order detail for consistency
      await models.OrderDetail.create({ id_order: order.id_order, id_produk: product.id_produk, quantity: 1, harga_satuan: totalBayar, subtotal_item: totalBayar, created_at: new Date(), updated_at: new Date() }, { transaction: t });

      // create payment with nominal 0 and status 'menunggu_verifikasi'
      const payment = await models.Payment.create({ id_order: order.id_order, id_customer: order.id_customer, no_transaksi: order.no_transaksi, no_hp: customer.no_hp, nominal: 0, bukti: '', tipe: 'dp', status: 'menunggu_verifikasi', tanggal: new Date(), created_at: new Date(), updated_at: new Date() }, { transaction: t });

      console.log('Created order:', order.no_transaksi, 'id_order=', order.id_order);
      console.log('Payment created: id_payment=', payment.id_payment, 'nominal=', payment.nominal, 'status=', payment.status);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error creating order/payment:', err);
    process.exit(1);
  }
}

main();
