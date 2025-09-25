require('dotenv').config();
const models = require('../src/models');

const NO = process.argv[2];
if (!NO) {
  console.error('Usage: node -r dotenv/config scripts/check_order_sisa.js <NO_TRANSAKSI>');
  process.exit(2);
}

(async () => {
  try {
    const order = await models.Order.findOne({ where: { no_transaksi: NO }, include: [models.Customer] });
    if (!order) {
      console.error('Order not found', NO);
      process.exit(2);
    }
    console.log('Order:');
    console.log({ id_order: order.id_order, no_transaksi: order.no_transaksi, total_harga: String(order.total_harga), total_bayar: String(order.total_bayar), dp_bayar: String(order.dp_bayar), status_bayar: order.status_bayar, status_order: order.status_order, status: order.status, updated_at: order.updated_at });

    const totalPaidAll = await models.Payment.sum('nominal', { where: { no_transaksi: NO } }) || 0;
    const totalPaidVerified = await models.Payment.sum('nominal', { where: { no_transaksi: NO, status: 'verified' } }) || 0;
    const sisaAll = Number((Number(order.total_bayar || 0) - Number(totalPaidAll || 0)).toFixed(2));
    const sisaVerified = Number((Number(order.total_bayar || 0) - Number(totalPaidVerified || 0)).toFixed(2));

    console.log('\nPayments summary:');
    console.log({ total_paid_all: Number(totalPaidAll || 0), total_paid_verified: Number(totalPaidVerified || 0), sisa_all: sisaAll, sisa_verified: sisaVerified });

  // Payment model uses `tanggal` column for timestamp
  const payments = await models.Payment.findAll({ where: { no_transaksi: NO }, order: [['tanggal', 'ASC']] });
    console.log('\nPayments (chronological):');
    payments.forEach(p => console.log({ id_payment: p.id_payment || p.id, nominal: Number(p.nominal||0), status: p.status, bukti: p.bukti||p.bukti_pembayaran||null, no_hp: p.no_hp, created_at: p.created_at }));

    // show piutangs for customer
    const cid = order.id_customer;
    if (cid) {
      const piutangs = await models.Piutang.findAll({ where: { id_customer: cid }, order: [['created_at','ASC']] });
      console.log('\nPiutangs for customer id', cid, ':');
      piutangs.forEach(p => console.log({ id: p.id, jumlah_piutang: Number(p.jumlah_piutang||0), paid: Number(p.paid||0), status: p.status, created_at: p.created_at }));
    }

    // show last server.log lines if present
    try {
      const fs = require('fs');
      const log = fs.readFileSync('server.log', 'utf8');
      const lines = log.trim().split('\n');
      console.log('\nLast 15 server.log lines:');
      console.log(lines.slice(-15).join('\n'));
    } catch (e) {
      // ignore
    }

    process.exit(0);
  } catch (err) {
    console.error('error', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
