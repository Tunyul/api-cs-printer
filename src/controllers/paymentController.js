
const models = require('../models');

module.exports = {
  createPayment: async (req, res) => {
    try {
      const { id_order, id_customer, nominal, bukti, tipe, no_hp, status } = req.body;
      if (!id_order || !nominal || !tipe) {
        return res.status(400).json({ error: 'id_order, nominal, dan tipe wajib diisi' });
      }
      const payment = await models.Payment.create({
        id_order,
        id_customer,
        nominal,
        bukti,
        tipe,
        no_hp,
        status: status || 'pending',
        created_at: new Date(),
        updated_at: new Date()
      });
      res.status(201).json(payment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getPayments: async (req, res) => {
    try {
      const payments = await models.Payment.findAll({
        include: [
          { model: models.Order, attributes: ['id_order', 'no_transaksi'] },
          { model: models.Customer, attributes: ['id_customer', 'nama', 'no_hp'] }
        ],
        order: [['tanggal', 'DESC']]
      });
      if (!payments || payments.length === 0) {
        return res.status(404).json({ error: 'No payments found' });
      }
      res.status(200).json(payments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getPaymentById: async (req, res) => {
    try {
      const payment = await models.Payment.findByPk(req.params.id, {
        include: [
          { model: models.Order, attributes: ['id_order', 'no_transaksi'] },
          { model: models.Customer, attributes: ['id_customer', 'nama', 'no_hp'] }
        ]
      });
      if (!payment) return res.status(404).json({ error: 'Payment not found' });
      res.status(200).json(payment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getPaymentsByOrder: async (req, res) => {
    try {
      const payments = await models.Payment.findAll({
        where: { id_order: req.params.order_id },
        include: [
          { model: models.Customer, attributes: ['id_customer', 'nama', 'no_hp'] }
        ],
        order: [['tanggal', 'DESC']]
      });
      if (!payments || payments.length === 0) {
        return res.status(404).json({ error: 'No payments found for this order' });
      }
      res.status(200).json(payments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getPaymentsByCustomer: async (req, res) => {
    try {
      const payments = await models.Payment.findAll({
        where: { id_customer: req.params.customer_id },
        include: [
          { model: models.Order, attributes: ['id_order', 'no_transaksi'] }
        ],
        order: [['tanggal', 'DESC']]
      });
      if (!payments || payments.length === 0) {
        return res.status(404).json({ error: 'No payments found for this customer' });
      }
      res.status(200).json(payments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  uploadBuktiPembayaran: async (req, res) => {
    try {
      const { id_payment } = req.params;
      const { bukti } = req.body;
      if (!bukti) return res.status(400).json({ error: 'Link bukti pembayaran wajib diisi' });
      const payment = await models.Payment.findByPk(id_payment);
      if (!payment) return res.status(404).json({ error: 'Payment tidak ditemukan' });
      await payment.update({ bukti });
      res.json(payment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  createPaymentByPhone: async (req, res) => {
    try {
      const { no_hp, bukti_pembayaran } = req.body;
      if (!no_hp || !bukti_pembayaran) return res.status(400).json({ error: 'no_hp dan bukti_pembayaran wajib diisi' });
      const customer = await models.Customer.findOne({ where: { no_hp } });
      if (!customer) return res.status(404).json({ error: 'Customer tidak ditemukan' });
      const order = await models.Order.findOne({ where: { id_customer: customer.id_customer, status_bot: 'pending' } });
      if (!order) return res.status(404).json({ error: 'Order tidak ditemukan' });
      await models.Payment.create({ id_order: order.id_order, bukti_pembayaran, status: 'menunggu_verifikasi', created_at: new Date(), updated_at: new Date() });
      res.status(201).json({ success: true, message: 'Bukti pembayaran diterima, menunggu verifikasi admin' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getPaymentsByPhone: async (req, res) => {
    try {
      const { no_hp } = req.query;
      if (!no_hp) return res.status(400).json({ error: 'no_hp wajib diisi' });
      const customer = await models.Customer.findOne({ where: { no_hp } });
      if (!customer) return res.status(404).json({ error: 'Customer tidak ditemukan' });
      const orders = await models.Order.findAll({ where: { id_customer: customer.id_customer } });
      if (!orders || orders.length === 0) return res.status(404).json({ error: 'Order tidak ditemukan' });
      const orderIds = orders.map(o => o.id_order);
      const payments = await models.Payment.findAll({ where: { id_order: orderIds } });
      if (!payments || payments.length === 0) return res.status(404).json({ error: 'Payment tidak ditemukan' });
      res.status(200).json(payments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  updatePaymentLinkByTransaksi: async (req, res) => {
    try {
      const { no_transaksi, link_bukti } = req.body;
      if (!no_transaksi || !link_bukti) return res.status(400).json({ error: 'no_transaksi dan link_bukti wajib diisi' });
      const order = await models.Order.findOne({ where: { no_transaksi } });
      if (!order) return res.status(404).json({ error: 'Order tidak ditemukan' });
      const payment = await models.Payment.findOne({ where: { id_order: order.id_order } });
      if (!payment) return res.status(404).json({ error: 'Payment tidak ditemukan' });
      await payment.update({ bukti_pembayaran: link_bukti, updated_at: new Date() });
      res.status(200).json(payment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};
