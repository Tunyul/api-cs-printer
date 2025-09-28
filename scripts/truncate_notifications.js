#!/usr/bin/env node
/*
  Truncate the notifications table only.
  Usage:
    node scripts/truncate_notifications.js
  The script will prompt for confirmation. Use TRUNCATE_YES=1 to skip prompt.
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
    const name = 'Notification';
    const model = models[name];

    if (!model || !model.tableName) {
      console.error('Model Notification not found in models index. Aborting.');
      process.exit(1);
    }

    let ans = 'YES';
    if (!autoYes) {
      ans = await confirmPrompt(`This will TRUNCATE ${name} (table ${model.tableName}). Type YES to continue: `);
    } else {
      console.log('Auto-confirm enabled (--yes or TRUNCATE_YES=1). Proceeding with truncation.');
    }

    if ((ans || '').trim() !== 'YES') {
      console.log('Aborted. No changes made.');
      process.exit(0);
    }

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
        const backupFile = path.join(backupDir, `notifications-backup-${ts}.sql`);
        const dbcfg = require('../src/config/database');
        console.log('Creating mysqldump backup to', backupFile);
        const env = Object.assign({}, process.env, { MYSQL_PWD: dbcfg.password });
        const cmd = `mysqldump --host=${dbcfg.host} -u ${dbcfg.username} ${dbcfg.database} ${model.tableName} > ${backupFile}`;
        execSync(cmd, { env, stdio: 'inherit', shell: true });
        console.log('Backup saved to', backupFile);
      } catch (e) {
        console.warn('Could not create mysqldump backup:', e && e.message ? e.message : e);
      }
    }

    await sequelize.transaction(async (t) => {
      if (dialect === 'mysql' || dialect === 'mariadb') {
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction: t });
      }

      console.log('Truncating', name, '->', model.tableName);
      if (dialect === 'postgres') {
        await sequelize.query(`TRUNCATE TABLE "${model.tableName}" RESTART IDENTITY CASCADE`, { transaction: t });
      } else {
        await model.destroy({ where: {}, truncate: true, force: true, transaction: t });
      }

      if (dialect === 'mysql' || dialect === 'mariadb') {
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction: t });
      }
    });

    console.log('Truncate completed for notifications.');
    process.exit(0);
  } catch (err) {
    console.error('Error while truncating notifications:', err);
    process.exit(1);
  }
}

run();
