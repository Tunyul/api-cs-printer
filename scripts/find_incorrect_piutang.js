const models = require('../src/models');

async function main() {
  try {
    const problem = await models.Piutang.findAll({
      where: { status: 'lunas' },
      include: [{ model: models.Order }]
    });
    const bad = problem.filter(p => p.Order && Number(p.Order.dp_bayar || 0) < Number(p.Order.total_bayar || 0));
    console.log('Found', bad.length, 'piutang rows where status=lunas but order.dp_bayar < order.total_bayar');
    for (const p of bad) {
      console.log({ id_piutang: p.id_piutang || p.id, id_order: p.id_order, jumlah_piutang: p.jumlah_piutang, paid: p.paid, piutang_status: p.status, order_dp: p.Order ? p.Order.dp_bayar : null, order_total: p.Order ? p.Order.total_bayar : null });
    }
  } catch (e) {
    console.error(e && e.message ? e.message : e);
    process.exit(1);
  }
}

main();
