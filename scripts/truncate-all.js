/*
Safe truncate-all script.
Disables foreign key checks, truncates a safe-ordered list of tables if they exist, then re-enables checks.
Run in dev only: node scripts/truncate-all.js
WARNING: Destructive. Make backups before running in staging/production.
*/

const { Sequelize } = require('sequelize');
const config = require('../src/config/database');

async function run() {
  if (!process.env.SAFE_RUN) {
    console.error('This script is destructive. Set SAFE_RUN=1 and rerun to proceed.');
    process.exit(1);
  }
  const sequelize = new Sequelize(config.database, config.username, config.password, config);

  // Recommended safe order: child tables first, then parents.
  // Adjust names as used in your DB (some tables may be singular/plural); script checks existence.
  const candidateTables = [
    'order_deletion_audits',
    'order_details',
    'payments',
    'piutang',
    'piutangs',
    'orders',
    'products',
    'customers',
    'users',
    'migrations',
    'seeds',
    // legacy or auxiliary tables
    'product_images',
    'categories'
  ];

  try {
    console.log('Connecting to DB...');
    await sequelize.authenticate();

    async function tableExists(tableName) {
      const sql = `SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?`;
      const [rows] = await sequelize.query(sql, { replacements: [tableName] });
      return rows && rows[0] && Number(rows[0].cnt) > 0;
    }

    const existingTables = [];
    for (const t of candidateTables) {
      if (await tableExists(t)) existingTables.push(t);
      else console.log(`Table not found, skipping: ${t}`);
    }

    if (existingTables.length === 0) {
      console.log('No target tables found in database. Nothing to do.');
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
  } catch (err) {
    console.error('Error during truncate:', err);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

run();
