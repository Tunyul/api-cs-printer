'use strict';

const crypto = require('crypto');

const DEFAULT_EXPIRES = 24 * 60 * 60; // 1 day in seconds

function generateToken() {
  return crypto.randomBytes(32).toString('base64url');
}

module.exports = {
  async createInvoiceToken(req, res) {
    try {
      const { no_transaksi, expires_in, note } = req.body;
      if (!no_transaksi) return res.status(400).json({ error: 'no_transaksi is required' });

      const models = req.app.get('models');
      const order = await models.Order.findOne({ where: { no_transaksi } });
      if (!order) return res.status(404).json({ error: 'Order not found' });

      const token = generateToken();
      const expiresSeconds = Number.isInteger(expires_in) ? expires_in : DEFAULT_EXPIRES;
      const expires_at = new Date(Date.now() + expiresSeconds * 1000);

      const invoiceToken = await models.InvoiceToken.create({ token, no_transaksi, note, expires_at });

  const getAppUrl = require('../utils/getAppUrl');
  const appUrl = process.env.APP_URL || getAppUrl() || `${req.protocol}://${req.get('host')}`;
  const url = `${appUrl.replace(/\/$/, '')}/api/invoices/token/${token}`;

      return res.status(201).json({ data: { token, url, expires_at: expires_at.toISOString() } });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  async getInvoiceByToken(req, res) {
    try {
      const token = req.params.token;
      const models = req.app.get('models');
      const invoiceToken = await models.InvoiceToken.findOne({ where: { token } });
      if (!invoiceToken) return res.status(404).json({ error: 'Token not found' });

      if (invoiceToken.expires_at && new Date(invoiceToken.expires_at) < new Date()) {
        return res.status(410).json({ error: 'Token expired' });
      }

      // Aggregate data
      const order = await models.Order.findOne({
        where: { no_transaksi: invoiceToken.no_transaksi },
        include: [{ model: models.OrderDetail, include: [models.Product] }]
      });
      if (!order) return res.status(404).json({ error: 'Order not found' });

      const payments = await models.Payment.findAll({ where: { no_transaksi: invoiceToken.no_transaksi } });
      const customer = await models.Customer.findOne({ where: { id_customer: order.id_customer } });

      // Optionally set used_at for one-time tokens (not enabled by default)
      // await invoiceToken.update({ used_at: new Date() });

      return res.status(200).json({ data: {
        token: invoiceToken.token,
        no_transaksi: invoiceToken.no_transaksi,
        expires_at: invoiceToken.expires_at,
        order,
        order_details: order.OrderDetails || [],
        payments,
        customer
      }});
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  ,

  async deleteInvoiceToken(req, res) {
    try {
      // auth middleware has set req.user
      if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
      const token = req.params.token;
      const models = req.app.get('models');
      const invoiceToken = await models.InvoiceToken.findOne({ where: { token } });
      if (!invoiceToken) return res.status(404).json({ error: 'Token not found' });
      await invoiceToken.destroy();
      return res.status(200).json({ success: true, message: 'Token revoked' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
};
