#!/usr/bin/env node
/*
Safe reset for a single customer's orders.
Deletes rows from: order_details, payments, piutangs, orders for the given customer.

Usage:
  node scripts/reset-orders-customer.js --no_hp=1111         # dry-run (shows counts)
  node scripts/reset-orders-customer.js --no_hp=1111 --yes   # execute
  node scripts/reset-orders-customer.js --id=1 --yes        # execute by id_customer

The script is defensive: it checks table existence, runs inside a transaction,
and disables foreign key checks during truncation steps.
*/

const models = require('../src/models');
const argv = require('yargs/yargs')(process.argv.slice(2)).argv;

async function tableExists(sequelize, tableName) {
  const sql = `SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?`;
  const [rows] = await sequelize.query(sql, { replacements: [tableName] });
  return rows && rows[0] && Number(rows[0].cnt) > 0;
}

(async () => {
  const { no_hp, id, yes } = argv;
  if (!no_hp && !id) {
    console.error('Usage: --no_hp=<phone> OR --id=<id_customer> (add --yes to execute)');
    process.exit(1);
  }

  await models.sequelize.authenticate();
  const sequelize = models.sequelize;

  let customer;
  if (no_hp) customer = await models.Customer.findOne({ where: { no_hp } });
  if (id && !customer) customer = await models.Customer.findOne({ where: { id_customer: id } });
  if (!customer) {
    console.error('Customer not found');
    process.exit(1);
  }

  const id_customer = customer.id_customer;
  console.log(`Target customer: id_customer=${id_customer}, nama=${customer.nama}, no_hp=${customer.no_hp}`);

  // find orders
  const orderRows = await models.Order.findAll({ where: { id_customer } });
  const orderIds = orderRows.map(o => o.id_order).filter(Boolean);
  const noTrans = orderRows.map(o => o.no_transaksi).filter(Boolean);

  console.log('Found orders:', orderIds.length);

  // helper to show counts
  async function counts() {
    const out = {};
    if (orderIds.length > 0) {
      const [[{ c1 }]] = await sequelize.query(`SELECT COUNT(*) as c1 FROM order_details WHERE id_order IN (${orderIds.join(',')})`);
      out.order_details = Number(c1 || 0);
      const [[{ c2 }]] = await sequelize.query(`SELECT COUNT(*) as c2 FROM payments WHERE id_order IN (${orderIds.join(',')})`);
      out.payments_by_order = Number(c2 || 0);
      // payments by no_trans
      if (noTrans.length > 0) {
        const inList = noTrans.map(n => `'${n.replace(/'/g, "''")}'`).join(',');
        const [[{ c3 }]] = await sequelize.query(`SELECT COUNT(*) as c3 FROM payments WHERE no_transaksi IN (${inList})`);
        out.payments_by_no_trans = Number(c3 || 0);
      }
    } else {
      out.order_details = 0;
      out.payments_by_order = 0;
      out.payments_by_no_trans = 0;
    }
    // piutang for customer
    const [[{ c4 }]] = await sequelize.query(`SELECT COUNT(*) as c4 FROM piutang WHERE id_customer = ?`, { replacements: [id_customer] });
    out.piutang = Number(c4 || 0);
    out.orders = orderIds.length;
    return out;
  }

  const before = await counts();
  console.log('Counts before:', before);

  if (!yes) {
    console.log('\nDry-run: no changes made. Re-run with --yes to execute deletion.');
    process.exit(0);
  }

  // perform deletion inside transaction
  try {
    await sequelize.transaction(async (t) => {
      console.log('Disabling FK checks...');
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction: t });

      if (orderIds.length > 0) {
        console.log('Deleting order_details...');
        await models.OrderDetail.destroy({ where: { id_order: orderIds }, transaction: t });

        console.log('Deleting payments by id_order...');
        if (models.Payment) {
          await models.Payment.destroy({ where: { id_order: orderIds }, transaction: t });
        }

        if (noTrans.length > 0 && models.Payment) {
          console.log('Deleting payments by no_transaksi...');
          await models.Payment.destroy({ where: { no_transaksi: noTrans }, transaction: t });
        }

        console.log('Deleting orders...');
        await models.Order.destroy({ where: { id_order: orderIds }, transaction: t });
      }

      console.log('Deleting piutang for customer...');
      if (await tableExists(sequelize, 'piutang')) {
        await models.Piutang.destroy({ where: { id_customer }, transaction: t });
      } else {
        console.log('Table piutang not found, skipping');
      }

      console.log('Re-enabling FK checks...');
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction: t });
    });

    const after = await counts();
    console.log('Counts after:', after);
    console.log('Done.');
    process.exit(0);
  } catch (e) {
    console.error('Error during reset:', e.message || e);
    process.exit(1);
  }

})();
