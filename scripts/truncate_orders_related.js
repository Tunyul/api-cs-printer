#!/usr/bin/env node
/*
  Truncate only order-related tables: OrderDetail, Order, Payment, Piutang
  Usage:
    node scripts/truncate_orders_related.js
  The script will prompt for confirmation. Type YES to proceed.
*/

const readline = require('readline');
const models = require('../src/models');

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
    const sequelize = models.sequelize;
    const autoYes = process.argv.includes('--yes') || process.env.TRUNCATE_YES === '1';
    const toTruncateNames = ['OrderDetail', 'Order', 'Payment', 'Piutang'];
    const available = Object.keys(models).filter(k => ['sequelize','Sequelize'].indexOf(k)===-1);
    console.log('Available models:', available);

    const missing = toTruncateNames.filter(n => !available.includes(n));
    if (missing.length > 0) {
      console.warn('Warning: some expected models are not present in models index:', missing);
    }

    let ans = 'YES';
    if (!autoYes) {
      ans = await confirmPrompt('This will TRUNCATE OrderDetail, Order, Payment, Piutang. Type YES to continue: ');
    } else {
      console.log('Auto-confirm enabled (--yes or TRUNCATE_YES=1). Proceeding with truncation.');
    }
    if ((ans || '').trim() !== 'YES') {
      console.log('Aborted. No changes made.');
      process.exit(0);
    }

    // Optionally create a mysqldump backup for the tables before truncation
    const noBackup = process.argv.includes('--no-backup');
    const dialect = sequelize.getDialect();
    if (!noBackup && dialect === 'mysql') {
      try {
        const { execSync } = require('child_process');
        const path = require('path');
        const fs = require('fs');
        const backupDir = path.resolve(__dirname, '..', 'backups');
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
        const ts = new Date().toISOString().replace(/[:.]/g,'-');
        const backupFile = path.join(backupDir, `orders-backup-${ts}.sql`);
        const dbcfg = require('../src/config/database');
        const tables = toTruncateNames.map(n => {
          const m = models[n];
          return m && m.tableName ? m.tableName : null;
        }).filter(Boolean).join(' ');
        if (tables.length > 0) {
          console.log('Creating mysqldump backup to', backupFile);
          const env = Object.assign({}, process.env, { MYSQL_PWD: dbcfg.password });
          const cmd = `mysqldump --host=${dbcfg.host} -u ${dbcfg.username} ${dbcfg.database} ${tables} > ${backupFile}`;
          execSync(cmd, { env, stdio: 'inherit', shell: true });
          console.log('Backup saved to', backupFile);
        }
      } catch (e) {
        console.warn('Could not create mysqldump backup:', e && e.message ? e.message : e);
      }
    }

    // Run in a transaction; temporarily disable FK checks for MySQL
    await sequelize.transaction(async (t) => {
      const dialect = sequelize.getDialect();
      if (dialect === 'mysql' || dialect === 'mariadb') {
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction: t });
      }

      for (const name of toTruncateNames) {
        const model = models[name];
        if (!model || !model.tableName) {
          console.log('Skipping missing model:', name);
          continue;
        }
        console.log('Truncating', name, '->', model.tableName);
        if (dialect === 'postgres') {
          await sequelize.query(`TRUNCATE TABLE "${model.tableName}" RESTART IDENTITY CASCADE`, { transaction: t });
        } else {
          await model.destroy({ where: {}, truncate: true, force: true, transaction: t });
        }
      }

      if (dialect === 'mysql' || dialect === 'mariadb') {
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction: t });
      }
    });

    console.log('Truncate completed for order-related tables.');
    process.exit(0);
  } catch (err) {
    console.error('Error while truncating:', err);
    process.exit(1);
  }
}

run();
