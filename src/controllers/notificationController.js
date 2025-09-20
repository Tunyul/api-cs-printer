'use strict';
const models = require('../models');

module.exports = {
  // GET /api/notifications?recipient_type=user&recipient_id=5&limit=20&offset=0
  async list(req, res) {
    try {
      const { recipient_type, recipient_id } = req.query;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      if (!recipient_type || !recipient_id) return res.status(400).json({ error: 'recipient_type and recipient_id are required' });

      const where = { recipient_type, recipient_id };
      const items = await models.Notification.findAll({ where, order: [['created_at', 'DESC']], limit, offset });
      res.json({ success: true, data: items });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // PUT /api/notifications/:id/read
  async markRead(req, res) {
    try {
      const id = req.params.id;
      const notif = await models.Notification.findByPk(id);
      if (!notif) return res.status(404).json({ error: 'Notification not found' });
      await notif.update({ read: true, updated_at: new Date() });
      res.json({ success: true, data: notif });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
