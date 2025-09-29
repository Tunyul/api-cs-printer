#!/usr/bin/env node
require('dotenv').config();

const models = require('../src/models');
const { Op } = require('sequelize');
const readline = require('readline');

async function confirmPrompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (ans) => {
      rl.close();
      resolve(ans);
    });
  });
}

async function run() {
  try {
    const autoYes = process.argv.includes('--yes') || process.env.REBUILD_PIUTANGS_YES === '1';
    if (!autoYes) {
      const ans = await confirmPrompt('This will create piutang rows for orders with outstanding amounts. Continue? Type YES to proceed: ');
      if ((ans || '').trim() !== 'YES') {
        console.log('Aborted. No changes made.');
        process.exit(0);
      }
    }

    // We'll create piutang rows per order where outstanding > 0
    const orders = await models.Order.findAll({ where: {}, include: [models.Customer] });
    let created = 0;
    for (const order of orders) {
      const totalPaid = await models.Payment.sum('nominal', { where: { no_transaksi: order.no_transaksi, status: 'verified' } }) || 0;
      const remaining = Number(order.total_bayar || 0) - Number(totalPaid || 0);
      if (remaining > 0) {
        // create a piutang row for this order
        await models.Piutang.create({
          id_customer: order.id_customer,
          jumlah_piutang: remaining,
          paid: Number(totalPaid || 0),
          tanggal_piutang: new Date(),
          status: remaining <= 0 ? 'lunas' : 'belum_lunas',
          keterangan: `Piutang rebuilt for ${order.no_transaksi}`,
          id_order: order.id_order,
          created_at: new Date(),
          updated_at: new Date()
        });
        created++;
      }
    }

    console.log(`Rebuild completed. Created ${created} piutang rows.`);
    process.exit(0);
  } catch (err) {
    console.error('Rebuild error:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

run();
