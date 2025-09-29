#!/usr/bin/env node
// scripts/set_ukuran_from_harga_per_pcs.js
// Set products.ukuran_standar to 'm' when harga_per_pcs equals target (e.g., 25000), otherwise 'pcs'.
// Usage: TARGET=25000 node scripts/set_ukuran_from_harga_per_pcs.js

const readline = require('readline');
const models = require('../src/models');
const sequelize = models.sequelize;

const TARGET = process.env.TARGET ? Number(process.env.TARGET) : 25000;

async function plan() {
  const products = await sequelize.query(`SELECT id_produk, nama_produk, harga_per_pcs, ukuran_standar FROM products`, { type: sequelize.QueryTypes.SELECT });
  const plan = products.map(p => ({ id: p.id_produk, nama: p.nama_produk, harga_per_pcs: p.harga_per_pcs, from: p.ukuran_standar, to: (Number(p.harga_per_pcs) === TARGET ? 'm' : 'pcs') }));
  return plan;
}

async function apply(plan) {
  const t = await sequelize.transaction();
  try {
    for (const p of plan) {
      await sequelize.query(`UPDATE products SET ukuran_standar = ? WHERE id_produk = ?`, { replacements: [p.to, p.id], transaction: t });
    }
    await t.commit();
    return true;
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

async function main() {
  try {
    await sequelize.authenticate();
  } catch (err) {
    console.error('DB connect failed:', err.message || err);
    process.exit(1);
  }
  const planEntries = await plan();
  const counts = planEntries.reduce((acc, p) => { acc[p.to] = (acc[p.to] || 0) + 1; return acc; }, {});
  console.log('Target harga_per_pcs:', TARGET);
  console.log('Planned updates counts:', counts);
  console.table(planEntries.slice(0, 20));
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('Apply updates? type YES to proceed: ', async (ans) => {
    rl.close();
    if (ans !== 'YES') { console.log('Aborted'); process.exit(0); }
    try {
      await apply(planEntries);
      console.log('Done');
      process.exit(0);
    } catch (err) {
      console.error('Failed to apply:', err.message || err);
      process.exit(1);
    }
  });
}

if (require.main === module) main();
