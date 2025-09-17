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
 *             $ref: '#/components/schemas/Payment'
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

module.exports = router;
