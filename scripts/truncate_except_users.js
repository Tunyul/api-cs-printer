#!/usr/bin/env node
/*
  Truncate all tables except users.
  Usage:
    node scripts/truncate_except_users.js
  Make sure your NODE_ENV and DB config are set correctly.
*/

(async () => {
  try {
    const db = require('../src/models');
    const sequelize = db.sequelize;

    // Map modelName -> tableName (use model.tableName if present or fallback)
    const models = Object.keys(db).filter(k => ['sequelize','Sequelize'].indexOf(k) === -1).map(k => ({ name: k, model: db[k] }));

    // Determine table names and skip users table
    const skipTables = ['users', 'Users', 'User'];

    // Collect unique table names
    const tables = [];
    for (const m of models) {
      try {
        const tbl = (m.model && m.model.getTableName) ? m.model.getTableName() : null;
        if (!tbl) continue;
        // getTableName may return object in some setups
        const tableName = typeof tbl === 'object' ? tbl.tableName : tbl;
        if (skipTables.includes(tableName)) continue;
        if (!tables.includes(tableName)) tables.push(tableName);
      } catch (e) {
        // ignore
      }
    }

    if (tables.length === 0) {
      console.log('No tables to truncate (or only users table found).');
      process.exit(0);
    }

    console.log('Tables to truncate:', tables.join(', '));

    await sequelize.authenticate();

    // Disable FK checks, truncate, enable FK checks
    const dialect = sequelize.getDialect();
    if (dialect === 'mysql' || dialect === 'mariadb') {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
      for (const t of tables) {
        console.log('Truncating', t);
        await sequelize.query(`TRUNCATE TABLE \`${t}\``);
      }
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    } else if (dialect === 'postgres') {
      await sequelize.query('BEGIN');
      for (const t of tables) {
        console.log('Truncating', t);
        await sequelize.query(`TRUNCATE TABLE \"${t}\" RESTART IDENTITY CASCADE`);
      }
      await sequelize.query('COMMIT');
    } else if (dialect === 'sqlite') {
      await sequelize.query('PRAGMA foreign_keys = OFF');
      for (const t of tables) {
        console.log('Deleting from', t);
        await sequelize.query(`DELETE FROM \"${t}\"`);
      }
      await sequelize.query('PRAGMA foreign_keys = ON');
    } else {
      throw new Error('Unsupported dialect: ' + dialect);
    }

    console.log('Truncate completed.');
    process.exit(0);
  } catch (err) {
    console.error('Error truncating tables:', err.message || err);
    process.exit(1);
  }
})();
