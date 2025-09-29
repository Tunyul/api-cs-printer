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
    const autoYes = process.argv.includes('--yes') || process.env.REPAIR_PIUTANGS_YES === '1';
    if (!autoYes) {
      const ans = await confirmPrompt('This will recalculate `paid` and `status` on existing piutang rows using VERIFIED payments. Continue? Type YES to proceed: ');
      if ((ans || '').trim() !== 'YES') {
        console.log('Aborted. No changes made.');
        process.exit(0);
      }
    }

    const customerIds = await models.sequelize.query(
      'SELECT DISTINCT id_customer FROM piutang WHERE id_customer IS NOT NULL',
      { type: models.sequelize.QueryTypes.SELECT }
    );

    if (!customerIds || customerIds.length === 0) {
      console.log('No piutang rows found for any customer. Nothing to do.');
      process.exit(0);
    }

    for (const row of customerIds) {
      const customerId = row.id_customer;
      const t = await models.sequelize.transaction();
      try {
        const customer = await models.Customer.findByPk(customerId, { transaction: t });
        const customerPhone = customer ? customer.no_hp : null;

        const orders = await models.Order.findAll({ where: { id_customer: customerId }, attributes: ['no_transaksi'], transaction: t });
        const orderNos = orders.map(o => o.no_transaksi).filter(Boolean);

        const paymentWhere = {
          [Op.and]: [
            { status: 'verified' },
            { [Op.or]: [ ...(orderNos.length > 0 ? [{ no_transaksi: orderNos }] : []), ...(customerPhone ? [{ no_hp: customerPhone }] : []) ] }
          ]
        };

        const paymentsSum = await models.Payment.sum('nominal', { where: paymentWhere, transaction: t }) || 0;
        let remainingFunds = Number(paymentsSum || 0);

        const piutangs = await models.Piutang.findAll({ where: { id_customer: customerId }, order: [['created_at', 'ASC']], transaction: t });
        if (!piutangs || piutangs.length === 0) {
          await t.commit();
          continue;
        }

        let totalAllocated = 0;
        for (const p of piutangs) {
          const jumlah = Number(p.jumlah_piutang || 0);
          const prevPaid = Number(p.paid || 0);
          const remainingForThis = Math.max(0, jumlah - prevPaid);
          const allocation = Math.min(remainingForThis, remainingFunds);
          const newPaid = prevPaid + allocation;
          const newStatus = newPaid >= jumlah ? 'lunas' : 'belum_lunas';
          if (allocation > 0 || p.status !== newStatus) {
            await p.update({ paid: newPaid, status: newStatus, updated_at: new Date() }, { transaction: t });
          }
          remainingFunds = Math.max(0, remainingFunds - allocation);
          totalAllocated += allocation;
          if (remainingFunds <= 0) break;
        }

        await t.commit();
        console.log(`Customer ${customerId} - paymentsVerified=${paymentsSum} allocated=${totalAllocated} remainingFunds=${remainingFunds}`);
      } catch (err) {
        try { await t.rollback(); } catch (e) {}
        console.error('Error processing customer', customerId, err && err.message ? err.message : err);
      }
    }

    console.log('Piutang repair completed.');
    process.exit(0);
  } catch (err) {
    console.error('Repair script error:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

run();
