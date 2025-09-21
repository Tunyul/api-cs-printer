const { sequelize } = require('../src/models');

(async () => {
  try {
    console.log('Starting truncate products...');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await sequelize.query('TRUNCATE TABLE products');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    const [results] = await sequelize.query('SELECT COUNT(*) as cnt FROM products');
    console.log('products rows after truncate:', results[0].cnt);
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('Error truncating products:', err);
    try { await sequelize.close(); } catch (e) {}
    process.exit(1);
  }
})();