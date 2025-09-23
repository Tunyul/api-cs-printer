#!/usr/bin/env node
/*
  Truncate all tables except `Product` and `User`.
  Usage:
    node scripts/truncate_except_products_users.js
  This script will prompt for confirmation. Type YES to proceed.
*/

const readline = require('readline');
const models = require('../src/models');

const EXCLUDE = ['Product', 'User'];

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
    console.log('Models available:', Object.keys(models).filter(k => ['sequelize','Sequelize'].indexOf(k)===-1));
    const ans = await confirmPrompt('This will TRUNCATE all tables except Product and User. Type YES to continue: ');
    if (ans.trim() !== 'YES') {
      console.log('Aborted. No changes made.');
      process.exit(0);
    }

    const sequelize = models.sequelize;
    // Build list of model keys to truncate
    const toTruncate = Object.keys(models).filter(k => k !== 'sequelize' && k !== 'Sequelize' && EXCLUDE.indexOf(k) === -1);

    console.log('Will truncate models:', toTruncate);

    await sequelize.transaction(async (t) => {
      // Disable foreign key checks for MySQL during truncate
      const dialect = sequelize.getDialect();
      if (dialect === 'mysql' || dialect === 'mariadb') {
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction: t });
      } else if (dialect === 'postgres') {
        // postgres: use TRUNCATE ... CASCADE
      }

      for (const key of toTruncate) {
        const model = models[key];
        if (!model || !model.tableName) continue;
        console.log('Truncating', key, '->', model.tableName);
        if (sequelize.getDialect() === 'postgres') {
          await sequelize.query(`TRUNCATE TABLE \"${model.tableName}\" RESTART IDENTITY CASCADE`, { transaction: t });
        } else {
          await model.destroy({ where: {}, truncate: true, force: true, transaction: t });
        }
      }

      if (dialect === 'mysql' || dialect === 'mariadb') {
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction: t });
      }
    });

    console.log('Truncate completed.');
    process.exit(0);
  } catch (err) {
    console.error('Error while truncating:', err);
    process.exit(1);
  }
}

run();
