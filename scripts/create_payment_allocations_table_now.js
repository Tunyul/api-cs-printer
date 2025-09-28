const db = require('../src/models');

async function main() {
  try {
    const q = db.sequelize.getQueryInterface();
    await q.createTable('payment_allocations', {
      id_alloc: { type: db.Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      id_payment: { type: db.Sequelize.INTEGER, allowNull: false },
      id_piutang: { type: db.Sequelize.INTEGER, allowNull: false },
      amount: { type: db.Sequelize.DECIMAL(15,2), allowNull: false, defaultValue: 0.00 },
      tanggal_alloc: { type: db.Sequelize.DATE, allowNull: false, defaultValue: db.Sequelize.literal('CURRENT_TIMESTAMP') },
      note: { type: db.Sequelize.TEXT, allowNull: true },
      created_at: { type: db.Sequelize.DATE, allowNull: false, defaultValue: db.Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: db.Sequelize.DATE, allowNull: false, defaultValue: db.Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    console.log('payment_allocations table created');
  } catch (e) {
    console.error('create table failed', e && e.message ? e.message : e);
    process.exit(1);
  }
}

main();
