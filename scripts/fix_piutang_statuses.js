const models = require('../src/models');

async function main() {
  try {
    console.log('Scanning piutang rows for inconsistent statuses...');
    const rows = await models.Piutang.findAll({ where: { status: 'lunas' }, include: [models.Order] });
    let fixed = 0;
    for (const p of rows) {
      if (p.Order) {
        const dp = Number(p.Order.dp_bayar || 0);
        const tot = Number(p.Order.total_bayar || 0);
        if (dp < tot) {
          console.log(`Fixing piutang id=${p.id_piutang||p.id} (order=${p.id_order}) dp=${dp} < total=${tot}`);
          await p.update({ status: 'belum_lunas', updated_at: new Date() });
          fixed++;
        }
      }
    }
    console.log('Done. Fixed', fixed, 'rows.');
  } catch (e) {
    console.error('Error:', e && e.message ? e.message : e);
    process.exit(1);
  }
}

main();
