const models = require('../src/models');

async function main() {
  try {
    const custId = process.argv[2] || '1';
    const orderId = process.argv[3] || '1';
    const order = await models.Order.findByPk(orderId);
    console.log('Order:', order ? { id_order: order.id_order, no_transaksi: order.no_transaksi, dp_bayar: order.dp_bayar, total_bayar: order.total_bayar, status_bayar: order.status_bayar } : null);
  const paymentsOrder = order ? await models.Payment.findAll({ where: { no_transaksi: order.no_transaksi }, order: [['tanggal','ASC']] }) : [];
    console.log('Payments for order', order ? order.no_transaksi : 'N/A');
    for (const p of paymentsOrder) console.log({ id_payment: p.id_payment || p.id, nominal: p.nominal, status: p.status, tipe: p.tipe, no_hp: p.no_hp, created_at: p.created_at && p.created_at.toISOString() });

  const paymentsCust = await models.Payment.findAll({ where: { id_customer: custId }, order: [['tanggal','ASC']] });
    console.log('Payments for customer', custId);
    for (const p of paymentsCust) console.log({ id_payment: p.id_payment || p.id, no_transaksi: p.no_transaksi, nominal: p.nominal, status: p.status, tipe: p.tipe, created_at: p.created_at && p.created_at.toISOString() });

  } catch (e) {
    console.error('err', e && e.message ? e.message : e);
    process.exit(1);
  }
}

main();
