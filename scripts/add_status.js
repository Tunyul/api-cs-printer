(async ()=>{
  try {
    const models = require('../src/models');
    await models.sequelize.authenticate();
    const [results] = await models.sequelize.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='payments' AND COLUMN_NAME='status'");
    if (!results || results.length === 0) {
      console.log('Adding status column to payments');
      await models.sequelize.query("ALTER TABLE payments ADD COLUMN status ENUM('pending','menunggu_verifikasi','verified','confirmed') DEFAULT 'pending'");
      console.log('Column added');
    } else {
      console.log('Column status already exists');
    }
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message || e);
    process.exit(1);
  }
})();
