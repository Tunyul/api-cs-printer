const models = require('../src/models');

async function main() {
  try {
    const custId = process.argv[2] || '1';
    const orders = await models.Order.findAll({ where: { id_customer: custId } });
    console.log('Orders for customer', custId);
    for (const o of orders) console.log({ id_order: o.id_order, no_transaksi: o.no_transaksi, total_bayar: o.total_bayar, dp_bayar: o.dp_bayar, status: o.status, status_bayar: o.status_bayar });
  } catch (e) {
    console.error(e && e.message ? e.message : e);
    process.exit(1);
  }
}

main();
