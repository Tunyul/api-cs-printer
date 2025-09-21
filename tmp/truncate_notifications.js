// tmp/truncate_notifications.js
// Loads the project's Sequelize models and truncates the notifications table.

const path = require('path');
const models = require(path.resolve(__dirname, '../src/models'));

async function run() {
  try {
    console.log('Connecting to DB via Sequelize...');
    await models.sequelize.authenticate();
    console.log('Connected. Counting notifications...');
    const before = await models.Notification.count();
    console.log('Notifications before:', before);

    console.log('Truncating notifications table...');
    // Use destroy with truncate to reset auto-increment as well
    await models.Notification.destroy({ where: {}, truncate: true });

    const after = await models.Notification.count();
    console.log('Notifications after:', after);
    process.exit(0);
  } catch (err) {
    console.error('Error truncating notifications:', err);
    process.exit(1);
  }
}

run();
