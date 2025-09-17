const express = require('express');
const router = express.Router();
const orderDetailController = require('../controllers/orderDetailController');

/**
 * @swagger
 * tags:
 *   name: OrderDetail
 *   description: Order detail management
 */

/**
 * @swagger
 * /api/order-detail:
 *   post:
 *     summary: Create order detail
 *     tags: [OrderDetail]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderDetail'
 *     responses:
 *       201:
 *         description: Order detail created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderDetail'
 *       400:
 *         description: Invalid input
 */
router.post('/', orderDetailController.createOrderDetail);
/**
 * @swagger
 * /api/order-detail/order/{order_id}:
 *   get:
 *     summary: Get order details by order ID
 *     tags: [OrderDetail]
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: List of order details
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OrderDetail'
 *       404:
 *         description: Order details not found
 */
router.get('/order/:order_id', orderDetailController.getOrderDetailsByOrderId);
/**
 * @swagger
 * /api/order-detail/{id}:
 *   get:
 *     summary: Get order detail by ID
 *     tags: [OrderDetail]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order detail ID
 *     responses:
 *       200:
 *         description: Order detail
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderDetail'
 *       404:
 *         description: Order detail not found
 */
router.get('/:id', orderDetailController.getOrderDetailById);
/**
 * @swagger
 * /api/order-detail:
 *   get:
 *     summary: Get all order details
 *     tags: [OrderDetail]
 *     responses:
 *       200:
 *         description: List of order details
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OrderDetail'
 */
router.get('/', orderDetailController.getAllOrderDetails);
/**
 * @swagger
 * /api/order-detail/{id}:
 *   put:
 *     summary: Update order detail by ID
 *     tags: [OrderDetail]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order detail ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderDetail'
 *     responses:
 *       200:
 *         description: Order detail updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderDetail'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Order detail not found
 */
router.put('/:id', orderDetailController.updateOrderDetail);
/**
 * @swagger
 * /api/order-detail/{id}:
 *   delete:
 *     summary: Delete order detail by ID
 *     tags: [OrderDetail]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order detail ID
 *     responses:
 *       204:
 *         description: Order detail deleted
 *       404:
 *         description: Order detail not found
 */
router.delete('/:id', orderDetailController.deleteOrderDetail);

module.exports = router;
