/* Safe truncate script for multiple tables: order_details, payments, piutangs, orders, products

Disables foreign key checks, checks table existence, truncates in safe order, re-enables FK checks, prints counts before/after.
Run: node scripts/truncate-many-tables.js
*/

const { Sequelize } = require('sequelize');
const config = require('../src/config/database');

(async () => {
  const sequelize = new Sequelize(config.database, config.username, config.password, config);
  const tables = ['order_details', 'payments', 'piutangs', 'orders', 'products'];
  try {
    console.log('Connecting to DB...');
    await sequelize.authenticate();

    // helper: check if table exists
    async function tableExists(tableName) {
      const sql = `SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?`;
      const [rows] = await sequelize.query(sql, { replacements: [tableName] });
      return rows && rows[0] && Number(rows[0].cnt) > 0;
    }

    const existingTables = [];
    for (const t of tables) {
      if (await tableExists(t)) existingTables.push(t);
      else console.log(`Table not found, skipping: ${t}`);
    }

    if (existingTables.length === 0) {
      console.log('No target tables found. Nothing to do.');
      await sequelize.close();
      return;
    }

    console.log('Counts before:');
    for (const t of existingTables) {
      const [[{ count }]] = await sequelize.query(`SELECT COUNT(*) as count FROM ${t}`);
      console.log(`${t}: ${count}`);
    }

    console.log('\nDisabling foreign key checks...');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    for (const t of existingTables) {
      try {
        console.log(`Truncating ${t}...`);
        await sequelize.query(`TRUNCATE TABLE ${t}`);
      } catch (e) {
        console.warn(`Failed to truncate ${t}:`, e.message || e);
      }
    }

    console.log('Re-enabling foreign key checks...');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\nCounts after:');
    for (const t of existingTables) {
      const [[{ count }]] = await sequelize.query(`SELECT COUNT(*) as count FROM ${t}`);
      console.log(`${t}: ${count}`);
    }

    console.log('\nDone.');
    await sequelize.close();
  } catch (e) {
    console.error('Error during truncate:', e);
    try { await sequelize.close(); } catch (er) {}
    process.exit(1);
  }
})();
