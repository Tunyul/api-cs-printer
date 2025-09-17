/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Order]
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *   post:
 *     summary: Create an order
 *     tags: [Order]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderCreate'
 *     responses:
 *       201:
 *         description: Order created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 */
/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Order]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order detail
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *   put:
 *     summary: Update order by ID
 *     tags: [Order]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderCreate'
 *     responses:
 *       200:
 *         description: Order updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *   delete:
 *     summary: Delete order by ID
 *     tags: [Order]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Order deleted
 */
/**
 * @swagger
 * /api/orders/transaksi/{no_transaksi}:
 *   get:
 *     summary: Get order by transaction number
 *     tags: [Order]
 *     parameters:
 *       - in: path
 *         name: no_transaksi
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction number
 *       - in: header
 *         name: bot
 *         required: true
 *         schema:
 *           type: string
 *           example: 'true'
 *         description: Bot header must be 'true'
 *     responses:
 *       200:
 *         description: Order detail
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Header bot=true wajib
 *       404:
 *         description: Order tidak ditemukan
 */
/**
 * @swagger
 * /api/orders/transaksi/{no_transaksi}/status-bot:
 *   put:
 *     summary: Update status bot by transaction number
 *     tags: [Order]
 *     parameters:
 *       - in: path
 *         name: no_transaksi
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status_bot:
 *                 type: string
 *                 example: selesai
 *     responses:
 *       200:
 *         description: Status bot updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order tidak ditemukan
 */
/**
 * @swagger
 * /api/orders/transaksi/{no_transaksi}/orderDetail:
 *   put:
 *     summary: Update order details by transaction number
 *     tags: [Order]
 *     parameters:
 *       - in: path
 *         name: no_transaksi
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               details:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Order details updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order tidak ditemukan
 */
/**
 * @swagger
 * /api/orders/customer:
 *   get:
 *     summary: Get orders by customer phone number
 *     tags: [Order]
 *     parameters:
 *       - in: query
 *         name: no_hp
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer phone number
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       400:
 *         description: no_hp parameter is required
 *       404:
 *         description: Customer not found / Orders not found for this customer
 */
/**
 * @swagger
 * /api/orders/customer/{customerId}/total:
 *   get:
 *     summary: Get total bayar by customer ID
 *     tags: [Order]
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Total bayar
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_bayar:
 *                   type: number
 *                   format: float
 */
/**
 * @swagger
 * /api/orders/customer/phone/{phone}/total:
 *   get:
 *     summary: Get total bayar by customer phone
 *     tags: [Order]
 *     parameters:
 *       - in: path
 *         name: phone
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer phone number
 *     responses:
 *       200:
 *         description: Total bayar
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_bayar:
 *                   type: number
 *                   format: float
 */
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.put('/:id', orderController.updateOrder);
router.delete('/:id', orderController.deleteOrder);
 
router.put('/transaksi/:no_transaksi/status-bot', require('../controllers/orderController').updateStatusBotByNoTransaksi);
 
router.get('/transaksi/:no_transaksi', async (req, res) => {
	try {
		if (req.headers['bot'] !== 'true') {
			return res.status(400).json({ error: 'Header bot=true wajib' });
		}
		const models = require('../models');
		const order = await models.Order.findOne({
			where: { no_transaksi: req.params.no_transaksi },
			include: [{ model: models.OrderDetail, include: [models.Product] }]
		});
		if (!order) return res.status(404).json({ error: 'Order tidak ditemukan' });
		res.json(order);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});
 
router.put('/transaksi/:no_transaksi/orderDetail', require('../controllers/orderController').updateOrderDetailsByNoTransaksi);


 
router.post('/bot', async (req, res) => {
	try {
		if (req.headers['bot'] !== 'true') {
			return res.status(400).json({ error: 'Header bot=true required' });
		}
		const { no_hp } = req.body;
		if (!no_hp) {
			return res.status(400).json({ error: 'no_hp is required' });
		}
 
		const customer = await req.app.get('models').Customer.findOne({ where: { no_hp } });
		if (!customer) {
			return res.status(404).json({ error: 'Customer not found' });
		}
 
		let order = await req.app.get('models').Order.findOne({
			where: {
				id_customer: customer.id_customer,
				status_bot: 'pending'
			}
		});
		if (order) {
			return res.status(200).json(order);
		}
 
		const orderSelesai = await req.app.get('models').Order.findOne({
			where: {
				id_customer: customer.id_customer,
				status_bot: 'selesai'
			},
			order: [['tanggal_order', 'DESC']]
		});
 
		if (orderSelesai) {
			const generateTransactionNumber = require('../controllers/orderController').generateTransactionNumber;
			const nomor_transaksi = generateTransactionNumber(customer.nama);
			order = await req.app.get('models').Order.create({
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
			return res.status(201).json(order);
		}
 
		const generateTransactionNumber = require('../controllers/orderController').generateTransactionNumber;
		const nomor_transaksi = generateTransactionNumber(customer.nama);
		order = await req.app.get('models').Order.create({
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
		return res.status(201).json(order);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

 
router.get('/customer', orderController.getOrdersByCustomerId);

router.get('/customer/phone/:phone', orderController.getOrdersByCustomerPhone);
router.get('/:id', orderController.getOrderById);

router.post('/', orderController.createOrder);

router.put('/:id', orderController.updateOrder);

router.put('/transaksi/:no_transaksi', async (req, res) => {
  try {
    if (req.headers['bot'] !== 'true') {
      return res.status(400).json({ error: 'Header bot=true required' });
    }
    const no_transaksi = req.params.no_transaksi;
    if (!no_transaksi) {
      return res.status(400).json({ error: 'Param no_transaksi required' });
    }
    const updateData = req.body;
    const models = req.app.get('models');
    const order = await models.Order.findOne({ where: { no_transaksi } });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    await order.update(updateData);
    const updatedOrder = await models.Order.findOne({ where: { no_transaksi } });
    res.status(200).json({ success: true, message: 'Order updated', order: updatedOrder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/transaksi/:no_transaksi/order-details', require('../controllers/orderController').addOrderDetailByNoTransaksi);

router.get('/customer/:customerId/total', orderController.getCustomerTotalBayar);

router.get('/customer/phone/:phone/total', orderController.getCustomerTotalByPhone);

router.delete('/:id', orderController.deleteOrder);

router.get('/', orderController.getAllOrders);

router.put('/transaksi/:no_transaksi', require('../controllers/orderController').updateOrderDetailsByNoTransaksi);

module.exports = router;