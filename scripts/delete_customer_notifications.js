const models = require('../src/models');

(async () => {
  try {
    await models.sequelize.authenticate();
    console.log('DB connected');
    const { Notification } = models;
    const before = await Notification.count({ where: { recipient_type: 'user' } });
    console.log('customer notifications before:', before);
    // delete rows where recipient_type = 'user' OR recipient_id like 'customer:%'
    const Op = models.Sequelize.Op;
    const deleted = await Notification.destroy({ where: { [Op.or]: [{ recipient_type: 'user' }, { recipient_id: { [Op.like]: 'customer:%' } }] } });
    const after = await Notification.count({ where: { recipient_type: 'user' } });
    console.log('deleted rows:', deleted, 'customer notifications after:', after);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
