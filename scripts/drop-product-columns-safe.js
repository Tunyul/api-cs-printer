/*
Safely drop columns unit_area and pricing_unit from products if they exist.
Run: node scripts/drop-product-columns-safe.js
*/

const { Sequelize } = require('sequelize');
const config = require('../src/config/database');

(async () => {
  const sequelize = new Sequelize(config.database, config.username, config.password, config);
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');
    const table = 'products';
    const cols = ['unit_area', 'pricing_unit'];
    for (const c of cols) {
      const [[{ cnt }]] = await sequelize.query(`SELECT COUNT(*) as cnt FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`, { replacements: [table, c] });
      if (cnt > 0) {
        console.log(`Dropping column ${c}...`);
        await sequelize.query(`ALTER TABLE ${table} DROP COLUMN ${c}`);
        console.log(`${c} dropped`);
      } else {
        console.log(`Column ${c} does not exist, skipping`);
      }
    }
    console.log('Done.');
    await sequelize.close();
  } catch (e) {
    console.error('Error:', e);
    try { await sequelize.close(); } catch (err) {}
    process.exit(1);
  }
})();
