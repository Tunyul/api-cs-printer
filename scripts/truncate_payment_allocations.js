#!/usr/bin/env node
/* Truncate payment_allocations table safely with optional backup */
const readline = require('readline');
const models = require('../src/models');

async function confirmPrompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (ans) => { rl.close(); resolve(ans); });
  });
}

async function run() {
  try {
    const sequelize = models.sequelize;
    const autoYes = process.argv.includes('--yes') || process.env.TRUNCATE_YES === '1';
    let ans = 'YES';
    if (!autoYes) ans = await confirmPrompt('This will TRUNCATE payment_allocations. Type YES to continue: ');
    else console.log('Auto-confirm enabled. Proceeding.');
    if ((ans||'').trim() !== 'YES') { console.log('Aborted'); process.exit(0); }

    const dialect = sequelize.getDialect();
    try {
      const { execSync } = require('child_process');
      const path = require('path');
      const fs = require('fs');
      const backupDir = path.resolve(__dirname, '..', 'backups');
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
      const ts = new Date().toISOString().replace(/[:.]/g,'-');
      const backupFile = path.join(backupDir, `payment-allocations-backup-${ts}.sql`);
      const dbcfg = require('../src/config/database');
      const table = models.PaymentAllocation && models.PaymentAllocation.tableName ? models.PaymentAllocation.tableName : 'payment_allocations';
      console.log('Creating mysqldump backup to', backupFile);
      const env = Object.assign({}, process.env, { MYSQL_PWD: dbcfg.password });
      const cmd = `mysqldump --host=${dbcfg.host} -u ${dbcfg.username} ${dbcfg.database} ${table} > ${backupFile}`;
      execSync(cmd, { env, stdio: 'inherit', shell: true });
      console.log('Backup saved to', backupFile);
    } catch (e) {
      console.warn('Could not create mysqldump backup:', e && e.message ? e.message : e);
    }

    await sequelize.transaction(async (t) => {
      if (dialect === 'mysql' || dialect === 'mariadb') {
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction: t });
      }
      if (models.PaymentAllocation && models.PaymentAllocation.tableName) {
        const m = models.PaymentAllocation;
        if (dialect === 'postgres') {
          await sequelize.query(`TRUNCATE TABLE "${m.tableName}" RESTART IDENTITY CASCADE`, { transaction: t });
        } else {
          await m.destroy({ where: {}, truncate: true, force: true, transaction: t });
        }
      }
      if (dialect === 'mysql' || dialect === 'mariadb') {
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction: t });
      }
    });
    console.log('Truncated payment_allocations');
    process.exit(0);
  } catch (e) {
    console.error('Error truncating payment_allocations', e && e.message ? e.message : e);
    process.exit(1);
  }
}

run();
