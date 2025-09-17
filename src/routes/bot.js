const express = require('express');
const router = express.Router();
const models = require('../models');
/**
 * @swagger
 * /api/bot/payment:
 *   post:
 *     summary: Create payment by no_transaksi and link_bukti (bot)
 *     tags: [Bot]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               no_transaksi:
 *                 type: string
 *                 description: Nomor transaksi order
 *               link_bukti:
 *                 type: string
 *                 description: Link bukti pembayaran
 *               no_hp:
 *                 type: string
 *                 description: Nomor HP pelanggan
 *     responses:
 *       201:
 *         description: Payment created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       400:
 *         description: no_transaksi dan link_bukti wajib diisi
 *       404:
 *         description: Order tidak ditemukan
 */
router.post('/payment', botAuth, async (req, res) => {
  try {
    const { no_transaksi, link_bukti, no_hp } = req.body;
    if (!no_transaksi || !link_bukti || !no_hp) {
      return res.status(400).json({ error: 'no_transaksi, link_bukti, dan no_hp wajib diisi' });
    }
    const order = await models.Order.findOne({ where: { no_transaksi } });
    if (!order) {
      return res.status(404).json({ error: 'Order tidak ditemukan' });
    }
    let payment = await models.Payment.findOne({ where: { no_transaksi } });
  const nominal = order.nominal || 0;
  const tipe = order.tipe === 'dp' || order.tipe === 'pelunasan' ? order.tipe : 'dp';
    if (payment) {
      await payment.update({ bukti: link_bukti, no_hp, nominal, tipe, updated_at: new Date() });
      return res.status(200).json(payment);
    }
    payment = await models.Payment.create({
      id_order: order.id_order,
      no_transaksi,
      bukti: link_bukti,
      no_hp,
      nominal,
      tipe,
      status: 'pending'
    });
    const paymentReloaded = await models.Payment.findByPk(payment.id_payment);
    const result = paymentReloaded.toJSON();
    if (result.tanggal instanceof Date) {
      result.tanggal = result.tanggal.toISOString().slice(0, 19).replace('T', ' ');
    } else if (typeof result.tanggal === 'string') {
      const d = new Date(result.tanggal);
      if (!isNaN(d)) {
        result.tanggal = d.toISOString().slice(0, 19).replace('T', ' ');
      }
    }
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
/**
 * @swagger
 * /api/bot/products:
 *   get:
 *     summary: Get all products (bot)
 *     tags: [Bot]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       404:
 *         description: Produk tidak ditemukan
 */
router.get('/products', botAuth, async (req, res) => {
  try {
    const products = await models.Product.findAll();
    if (!products || products.length === 0) return res.status(404).json({ error: 'Produk tidak ditemukan' });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/**
 * @swagger
 * /api/bot/payment/update-link:
 *   put:
 *     summary: Update link bukti pembayaran by no_transaksi
 *     tags: [Bot]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               no_transaksi:
 *                 type: string
 *                 description: Nomor transaksi order
 *               link_bukti:
 *                 type: string
 *                 description: Link bukti pembayaran baru
 *     responses:
 *       200:
 *         description: Link bukti pembayaran updated
 *         content:
 *           application/json:
 *             schema:
*
 *       400:
 *         description: no_transaksi dan link_bukti wajib diisi
 *       404:
 *         description: Payment tidak ditemukan
 */

router.put('/payment/update-link', botAuth, async (req, res) => {
  try {
    const { no_transaksi, link_bukti } = req.body;
    if (!no_transaksi || !link_bukti) return res.status(400).json({ error: 'no_transaksi dan link_bukti wajib diisi' });
    const payment = await models.Payment.findOne({ where: { no_transaksi } });
    if (!payment) return res.status(404).json({ error: 'Payment tidak ditemukan' });
    await payment.update({ bukti: link_bukti });
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/bot/payment:
 *   get:
 *     summary: Get payments by customer phone
 *     tags: [Bot]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: no_hp
 *         schema:
 *           type: string
 *         required: true
 *         description: Nomor HP customer
 *     responses:
 *       200:
 *         description: Payments found
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Payment'
 *       400:
 *         description: no_hp wajib diisi
 *       404:
 *         description: Customer/order/payment tidak ditemukan
 */
router.get('/payment', botAuth, async (req, res) => {
  try {
    const { no_hp } = req.query;
    if (!no_hp) return res.status(400).json({ error: 'no_hp wajib diisi' });
    const customer = await models.Customer.findOne({ where: { no_hp } });
    if (!customer) return res.status(404).json({ error: 'Customer tidak ditemukan' });
    const orders = await models.Order.findAll({ where: { id_customer: customer.id_customer } });
    if (!orders || orders.length === 0) return res.status(404).json({ error: 'Order tidak ditemukan' });
  const orderNumbers = orders.map(o => o.no_transaksi);
  const payments = await models.Payment.findAll({ where: { no_transaksi: orderNumbers } });
    if (!payments || payments.length === 0) return res.status(404).json({ error: 'Payment tidak ditemukan' });
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



function botAuth(req, res, next) {
  if (req.headers['x-bot-key'] !== process.env.BOT_API_KEY) {
    return res.status(403).json({ error: 'Unauthorized bot access' });
  }
  next();
}

module.exports.botAuth = botAuth;

/**
 * @swagger
 * /api/bot/customer:
 *   get:
 *     summary: Get customer by phone (bot)
 *     tags: [Bot]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: no_hp
 *         schema:
 *           type: string
 *         required: true
 *         description: Nomor HP customer
 *     responses:
 *       200:
 *         description: Customer found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       404:
 *         description: Customer not found
 *       400:
 *         description: no_hp wajib diisi
 */
router.get('/customer', botAuth, async (req, res) => {
  const { no_hp } = req.query;
  if (!no_hp) {
    return res.status(400).json({ error: 'no_hp wajib diisi' });
  }
  try {
    const customer = await models.Customer.findOne({ where: { no_hp } });
    if (!customer) {
      return res.status(404).json({ error: 'Customer tidak ditemukan' });
    }
    return res.status(200).json(customer);
  } catch (err) {
    return res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});
/**
 * @swagger
 * tags:
 *   name: Bot
 *   description: Bot API for automation
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     ApiKeyAuth:
 *       type: apiKey
 *       in: header
 *       name: x-bot-key
 *   schemas:
 *     Payment:
 *       type: object
 *       properties:
 *         id_payment:
 *           type: integer
 *         id_order:
 *           type: integer
 *         amount:
 *           type: number
 *         status:
 *           type: string
 *         bukti_pembayaran:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     Customer:
 *       type: object
 *       properties:
 *         id_customer:
 *           type: integer
 *         no_hp:
 *           type: string
 *         nama:
 *           type: string
 *         tipe_customer:
 *           type: string
 *         batas_piutang:
 *           type: number
 *         catatan:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     Order:
 *       type: object
 *       properties:
 *         id_order:
 *           type: integer
 *         id_customer:
 *           type: integer
 *         no_transaksi:
 *           type: string
 *         tanggal_order:
 *           type: string
 *           format: date-time
 *         status_urgensi:
 *           type: string
 *         total_bayar:
 *           type: number
 *         dp_bayar:
 *           type: number
 *         status_bayar:
 *           type: string
 *         tanggal_jatuh_tempo:
 *           type: string
 *           format: date-time
 *         link_invoice:
 *           type: string
 *         link_drive:
 *           type: string
 *         status_order:
 *           type: string
 *         total_harga:
 *           type: number
 *         status:
 *           type: string
 *         catatan:
 *           type: string
 *         status_bot:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/bot/customer:
 *   post:
 *     summary: Create or get customer by phone (bot)
 *     tags: [Bot]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               no_hp:
 *                 type: string
 *                 description: Nomor HP customer
 *               nama:
 *                 type: string
 *                 description: Nama customer
 *     responses:
 *       201:
 *         description: Customer created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       200:
 *         description: Customer found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       400:
 *         description: no_hp wajib diisi
 */
router.post('/customer', botAuth, async (req, res) => {
  try {
    const { no_hp, nama } = req.body;
    if (!no_hp) return res.status(400).json({ error: 'no_hp wajib diisi' });
    let user = await models.Customer.findOne({ where: { no_hp } });
    if (!user) {
      user = await models.Customer.create({
        no_hp,
        nama: nama || no_hp,
        tipe_customer: 'reguler',
        batas_piutang: null,
        catatan: '',
        created_at: new Date(),
        updated_at: new Date()
      });
      return res.status(201).json(user);
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/bot/order:
 *   post:
 *     summary: Create or get pending order for customer (bot)
 *     tags: [Bot]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               no_hp:
 *                 type: string
 *                 description: Nomor HP customer
 *     responses:
 *       201:
 *         description: Order created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       200:
 *         description: Order found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: no_hp wajib diisi
 *       404:
 *         description: Customer tidak ditemukan
 */
router.post('/order', botAuth, async (req, res) => {
  try {
    const { no_hp } = req.body;
    if (!no_hp) return res.status(400).json({ error: 'no_hp wajib diisi' });
    const customer = await models.Customer.findOne({ where: { no_hp } });
    if (!customer) return res.status(404).json({ error: 'Customer tidak ditemukan' });
    let order = await models.Order.findOne({ where: { id_customer: customer.id_customer, status_bot: 'pending' } });
    if (order) return res.json(order);
    const generateTransactionNumber = require('../controllers/orderController').generateTransactionNumber;
    const nomor_transaksi = generateTransactionNumber(customer.nama);
    order = await models.Order.create({
      id_customer: customer.id_customer,
      no_transaksi: nomor_transaksi,
      tanggal_order: new Date(),
      status_urgensi: 'normal',
      total_bayar: 0,
      dp_bayar: 0,
      status_bayar: 'belum_lunas',
      tanggal_jatuh_tempo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      link_invoice: '',
      link_drive: '',
      status_order: 'pending',
      total_harga: 0,
      status: 'pending',
      catatan: '',
      status_bot: 'pending'
    });
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/bot/order-detail:
 *   post:
 *     summary: Add order details to order (bot)
 *     tags: [Bot]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               no_transaksi:
 *                 type: string
 *                 description: Nomor transaksi order
 *               order_details:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id_product:
 *                       type: integer
 *                     qty:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Order detail ditambahkan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: no_transaksi dan order_details wajib diisi
 *       404:
 *         description: Order tidak ditemukan
 */
router.post('/order-detail', botAuth, async (req, res) => {
  try {
    const { no_transaksi, order_details } = req.body;
    if (!no_transaksi || !order_details || !Array.isArray(order_details)) return res.status(400).json({ error: 'no_transaksi dan order_details wajib diisi' });
    const order = await models.Order.findOne({ where: { no_transaksi } });
    if (!order) return res.status(404).json({ error: 'Order tidak ditemukan' });
    for (const detail of order_details) {
      await models.OrderDetail.create({ id_order: order.id_order, id_product: detail.id_product, qty: detail.qty });
    }
    res.json({ success: true, message: 'Order detail ditambahkan' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/bot/order-by-phone:
 *   get:
 *     summary: Get pending order by customer phone (bot)
 *     tags: [Bot]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: no_hp
 *         required: true
 *         schema:
 *           type: string
 *         description: Nomor HP customer
 *     responses:
 *       200:
 *         description: Pending order found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: no_hp wajib diisi
 *       404:
 *         description: Order tidak ditemukan
 */
router.get('/order-by-phone', botAuth, async (req, res) => {
  try {
    const { no_hp } = req.query;
    if (!no_hp) return res.status(400).json({ error: 'no_hp wajib diisi' });
    const customer = await models.Customer.findOne({ where: { no_hp } });
    if (!customer) return res.status(404).json({ error: 'Customer tidak ditemukan' });
    const order = await models.Order.findOne({
      where: {
        id_customer: customer.id_customer,
        status_bot: 'pending'
      }
    });
    if (!order) {
      return res.status(404).json({ error: 'Order tidak ada' });
    }
    const orderDetails = await models.OrderDetail.findAll({ where: { id_order: order.id_order } });
    // Return data directly as requested
    return res.status(200).json({ order, order_details: orderDetails });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
/**
 * @swagger
 * /api/bot/order/update-link-drive:
 *   put:
 *     summary: Update link drive pada order (bot)
 *     tags: [Bot]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               no_transaksi:
 *                 type: string
 *               link_drive:
 *                 type: string
 *     responses:
 *       200:
 *         description: Link drive updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: no_transaksi dan link_drive wajib diisi
 *       404:
 *         description: Order tidak ditemukan
 */
router.put('/order/update-link-drive', botAuth, async (req, res) => {
  try {
    const { no_transaksi, link_drive } = req.body;
    if (!no_transaksi || !link_drive) return res.status(400).json({ error: 'no_transaksi dan link_drive wajib diisi' });
    const order = await models.Order.findOne({ where: { no_transaksi } });
    if (!order) return res.status(404).json({ error: 'Order tidak ditemukan' });
    await order.update({ link_drive });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
/**
 * @swagger
 * /api/bot/order/update:
 *   put:
 *     summary: Update order data (bot)
 *     tags: [Bot]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               no_transaksi:
 *                 type: string
 *               update_data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Order updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: no_transaksi dan update_data wajib diisi
 *       404:
 *         description: Order tidak ditemukan
 */
router.put('/order/update', botAuth, async (req, res) => {
  try {
    const { no_transaksi, update_data } = req.body;
    if (!no_transaksi || !update_data) return res.status(400).json({ error: 'no_transaksi dan update_data wajib diisi' });
    const order = await models.Order.findOne({ where: { no_transaksi } });
    if (!order) return res.status(404).json({ error: 'Order tidak ditemukan' });
    await order.update(update_data);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
/**
 * @swagger
 * /api/bot/order-detail/update:
 *   put:
 *     summary: Update order details (bot)
 *     tags: [Bot]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               no_transaksi:
 *                 type: string
 *               order_details:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id_product:
 *                       type: integer
 *                     qty:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Order details updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: no_transaksi dan order_details wajib diisi
 *       404:
 *         description: Order tidak ditemukan
 */
router.put('/order-detail/update', botAuth, async (req, res) => {
  try {
    const { no_transaksi, order_details } = req.body;
    if (!no_transaksi || !order_details || !Array.isArray(order_details)) return res.status(400).json({ error: 'no_transaksi dan order_details wajib diisi' });
    const order = await models.Order.findOne({ where: { no_transaksi } });
    if (!order) return res.status(404).json({ error: 'Order tidak ditemukan' });
    for (const detail of order_details) {
      await models.OrderDetail.update(
        { qty: detail.qty },
        { where: { id_order: order.id_order, id_product: detail.id_product } }
      );
    }
    res.json({ success: true, message: 'Order details updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = {
  router,
  botAuth
};
