const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const models = require('../models');
const { botAuth } = require('./bot');

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Create payment
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
	*           schema:
	*             $ref: '#/components/schemas/PaymentCreate'
	*           examples:
	*             fullCreate:
	*               summary: Full create with id_order, nominal and tipe
	*               value:
	*                 id_order: 123
	*                 nominal: 50000
	*                 tipe: "dp"
	*                 bukti: "https://drive.google.com/example"
	*                 no_hp: "081234567890"
	*             noHpBukti:
	*               summary: Create by phone + bukti (bot flow)
	*               value:
	*                 no_hp: "081234567890"
	*                 bukti: "https://drive.google.com/example"
	*             noTransaksiBukti:
	*               summary: Create by transaction number + bukti
	*               value:
	*                 no_transaksi: "TRX-18092025-4852-XYZ"
	*                 bukti: "https://drive.google.com/example"
 *     responses:
 *       201:
 *         description: Payment created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Invalid input
 */
router.post('/', paymentController.createPayment);
/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Get all payments
 *     tags: [Payment]
 *     responses:
 *       200:
 *         description: List of payments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Payment'
 */
router.get('/', paymentController.getPayments);
/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment detail
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       404:
 *         description: Payment not found
 */
router.get('/:id', paymentController.getPaymentById);
/**
 * @swagger
 * /api/payments/order/{order_id}:
 *   get:
 *     summary: Get payments by order ID
 *     tags: [Payment]
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: List of payments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Payment'
 *       404:
 *         description: Payments not found
 */
router.get('/order/:order_id', paymentController.getPaymentsByOrder);
// total paid for an order
router.get('/total-by-order/:order_id', paymentController.getTotalPaidByOrder);
/**
 * @swagger
 * /api/payments/transaksi/{no_transaksi}:
 *   get:
 *     summary: Get payments by transaction number (no_transaksi)
 *     tags: [Payment]
 *     parameters:
 *       - in: path
 *         name: no_transaksi
 *         required: true
 *         schema:
 *           type: string
 *         description: Nomor transaksi
 *     responses:
 *       200:
 *         description: List of payments for the transaction
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Payment'
 *       404:
 *         description: Payments not found for the provided transaction number
 */
// get payments by no_transaksi
router.get('/transaksi/:no_transaksi', paymentController.getPaymentsByTransaksi);
/**
 * @swagger
 * /api/payments/customer/{customer_id}:
 *   get:
 *     summary: Get payments by customer ID
 *     tags: [Payment]
 *     parameters:
 *       - in: path
 *         name: customer_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: List of payments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Payment'
 *       404:
 *         description: Payments not found
 */
router.get('/customer/:customer_id', paymentController.getPaymentsByCustomer);

// POST /api/bot/payment
router.post('/bot/payment', botAuth, paymentController.createPaymentByPhone);

// GET /api/bot/payment
router.get('/bot/payment', botAuth, paymentController.getPaymentsByPhone);

// PUT /api/bot/payment/update-link
router.put('/bot/payment/update-link', botAuth, paymentController.updatePaymentLinkByTransaksi);

// PUT update payment by id
/**
 * @swagger
 * /api/payments/{id}:
 *   put:
 *     summary: Update payment by ID
 *     tags: [Payment]
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
 *             type: object
 *             properties:
 *               bukti:
 *                 type: string
 *               nominal:
 *                 type: number
	*           examples:
	*             updateBukti:
	*               summary: Update bukti only
	*               value:
	*                 bukti: "https://drive.google.com/new-bukti"
	*             updateNominal:
	*               summary: Update nominal only
	*               value:
	*                 nominal: 75000
 *     responses:
 *       200:
 *         description: Updated payment
 */
router.put('/:id', paymentController.updatePaymentById);

// Admin approve payment (set nominal and verified)
router.put('/approve/:id', paymentController.approvePayment);

/**
 * @swagger
 * /api/payments:
 *   put:
 *     summary: Update payment by body (provide id_payment in body)
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_payment:
 *                 type: integer
 *               bukti:
 *                 type: string
 *               nominal:
 *                 type: number
 *     responses:
 *       200:
 *         description: Updated payment
 */
router.put('/', paymentController.updatePaymentById);

/**
 * @swagger
 * /api/payments/update-by-transaksi:
 *   put:
 *     summary: Update payment(s) by transaction number
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               no_transaksi:
 *                 type: string
 *               bukti:
 *                 type: string
 *               nominal:
 *                 type: number
 *           examples:
 *             byTransaksiBukti:
 *               summary: Update bukti for transaction
 *               value:
 *                 no_transaksi: "TRX-18092025-4852-XYZ"
 *                 bukti: "https://drive.google.com/new-bukti"
 *     responses:
 *       200:
 *         description: Updated payments
 */
router.put('/update-by-transaksi', paymentController.updatePaymentByTransaksi);

/**
 * @swagger
 * /api/payments/update-by-phone:
 *   put:
 *     summary: Update payment(s) by phone number
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               no_hp:
 *                 type: string
 *               bukti:
 *                 type: string
 *               nominal:
 *                 type: number
 *           examples:
 *             byPhoneBukti:
 *               summary: Update bukti for phone
 *               value:
 *                 no_hp: "081234567890"
 *                 bukti: "https://drive.google.com/new-bukti"
 *     responses:
 *       200:
 *         description: Updated payments
 */
router.put('/update-by-phone', paymentController.updatePaymentByPhone);

// PUT /api/payments (allow id in body as id_payment)
router.put('/', paymentController.updatePaymentById);

module.exports = router;
