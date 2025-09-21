'use strict';
const models = require('../models');

module.exports = {
  // GET /api/notifications?recipient_type=user&recipient_id=5&limit=20&offset=0
  async list(req, res) {
    try {
      let { recipient_type, recipient_id } = req.query;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      // If recipient not provided, try to infer from Authorization Bearer token
      if ((!recipient_type || !recipient_id) && req.headers && req.headers.authorization) {
        try {
          const jwt = require('jsonwebtoken');
          const secret = process.env.JWT_SECRET || 'secretkey';
          const token = String(req.headers.authorization).replace(/^Bearer\s+/i, '');
          const payload = jwt.verify(token, secret);
          if (payload && payload.role && String(payload.role).toLowerCase() === 'admin') {
            recipient_type = recipient_type || 'role';
            recipient_id = recipient_id || 'admin';
          } else if (payload && (payload.id_user || payload.id_customer)) {
            // prefer id_user, fall back to id_customer if present in token
            recipient_type = recipient_type || 'user';
            recipient_id = recipient_id || (payload.id_user || payload.id_customer);
          }
        } catch (e) {
          // ignore token errors and fall back to required check below
        }
      }

      if (!recipient_type || !recipient_id) return res.status(400).json({ error: 'recipient_type and recipient_id are required' });

      const where = { recipient_type, recipient_id };
      const items = await models.Notification.findAll({ where, order: [['created_at', 'DESC']], limit, offset });
      // map items to include parsed body if available
      const mapped = items.map(i => {
        const plain = i.get ? i.get({ plain: true }) : i;
        let body_parsed = null;
        try {
          if (plain.body) body_parsed = JSON.parse(plain.body);
        } catch (e) { body_parsed = null; }
        return Object.assign({}, plain, { body_parsed });
      });
      res.json({ success: true, data: mapped });
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

  ,

  // PUT /api/notifications/read-all?recipient_type=role&recipient_id=admin
  async markAllRead(req, res) {
    try {
      let { recipient_type, recipient_id } = req.query;
      // Try to infer from Authorization Bearer token like list()
      if ((!recipient_type || !recipient_id) && req.headers && req.headers.authorization) {
        try {
          const jwt = require('jsonwebtoken');
          const secret = process.env.JWT_SECRET || 'secretkey';
          const token = String(req.headers.authorization).replace(/^Bearer\s+/i, '');
          const payload = jwt.verify(token, secret);
          if (payload && payload.role && String(payload.role).toLowerCase() === 'admin') {
            recipient_type = recipient_type || 'role';
            recipient_id = recipient_id || 'admin';
          } else if (payload && (payload.id_user || payload.id_customer)) {
            recipient_type = recipient_type || 'user';
            recipient_id = recipient_id || (payload.id_user || payload.id_customer);
          }
        } catch (e) {
          // ignore
        }
      }
      if (!recipient_type || !recipient_id) return res.status(400).json({ error: 'recipient_type and recipient_id are required' });
      const where = { recipient_type, recipient_id };
      const updated = await models.Notification.update({ read: true, updated_at: new Date() }, { where });
      res.json({ success: true, updated: updated[0] || 0 });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
