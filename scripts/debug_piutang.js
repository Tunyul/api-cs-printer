const models = require('../src/models');

async function main() {
  try {
    const custId = process.argv[2] || '1';
    const pis = await models.Piutang.findAll({ where: { id_customer: custId }, include: [models.Order], order: [['created_at','ASC']] });
    console.log('Piutang rows for customer', custId);
    for (const p of pis) {
      console.log({ id_piutang: p.id_piutang || p.id, id_order: p.id_order, jumlah_piutang: p.jumlah_piutang, paid: p.paid, status: p.status, created_at: p.created_at && p.created_at.toISOString() });
      if (p.Order) {
        console.log('  relatedOrder:', { id_order: p.Order.id_order, no_transaksi: p.Order.no_transaksi, dp_bayar: p.Order.dp_bayar, total_bayar: p.Order.total_bayar, status: p.Order.status, status_bayar: p.Order.status_bayar });
      }
    }
  } catch (e) {
    console.error('err', e && e.message ? e.message : e);
    process.exit(1);
  }
}

main();
