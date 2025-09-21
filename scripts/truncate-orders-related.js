/* Safe truncate script for orders-related tables

This script disables foreign key checks, truncates child tables first, then truncates parent tables,
re-enables foreign key checks, and prints the counts before/after.

Run with: node scripts/truncate-orders-related.js

WARNING: Destructive. Ensure you're in a dev environment and have backups.
*/

const { Sequelize } = require('sequelize');
const config = require('../src/config/database');

async function run() {
  const sequelize = new Sequelize(config.database, config.username, config.password, config);

  // support both possible table names for piutang (legacy plural vs current singular)
  const tables = ['order_details', 'payments', 'piutang', 'piutangs', 'orders'];

  try {
    console.log('Connecting to DB...');
    await sequelize.authenticate();

    // helper: check if table exists in current database
    async function tableExists(tableName) {
      const sql = `SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?`;
      const [rows] = await sequelize.query(sql, { replacements: [tableName] });
      return rows && rows[0] && Number(rows[0].cnt) > 0;
    }

    // Filter tables to those that actually exist
    const existingTables = [];
    for (const t of tables) {
      if (await tableExists(t)) existingTables.push(t);
      else console.log(`Table not found, skipping: ${t}`);
    }

    if (existingTables.length === 0) {
      console.log('No target tables found in database. Nothing to do.');
      return;
    }

    // Print counts before
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

    // Print counts after
    console.log('\nCounts after:');
    for (const t of existingTables) {
      const [[{ count }]] = await sequelize.query(`SELECT COUNT(*) as count FROM ${t}`);
      console.log(`${t}: ${count}`);
    }

    console.log('\nDone.');
  } catch (err) {
    console.error('Error during truncate:', err);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

run();
