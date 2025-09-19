const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Get all customers (bisa filter by phone)
 *     tags: [Customer]
 *     parameters:
 *       - in: query
 *         name: phone
 *         schema:
 *           type: string
 *         description: Filter by nomor HP customer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Jumlah data per halaman (opsional, default 20)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Mulai dari data ke-berapa (opsional, default 0)
 *     responses:
 *       200:
 *         description: List of customers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Customer'
 *       404:
 *         description: No customers found
 */
router.get('/', customerController.getAllCustomers);
/**
 * @swagger
 * /api/customers:
 *   post:
 *     summary: Create new customer
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nama:
 *                 type: string
 *                 description: Nama customer (wajib)
 *               no_hp:
 *                 type: string
 *                 description: Nomor HP customer (wajib)
 *             required:
 *               - nama
 *               - no_hp
 *     responses:
 *       201:
 *         description: Customer created successfully
 *       400:
 *         description: Error creating customer
 */
router.post('/', customerController.createCustomer);

/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: Get customer by ID
 *     tags: [Customer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       404:
 *         description: Customer not found
 */
router.get('/:id', customerController.getCustomerById);

/**
 * @swagger
 * /api/customers/{id}:
 *   put:
 *     summary: Update customer by ID
 *     tags: [Customer]
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
 *             $ref: '#/components/schemas/Customer'
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *       404:
 *         description: Customer not found
 */
router.put('/:id', customerController.updateCustomer);
/**
 * @swagger
 * /api/customers/{id}:
 *   delete:
 *     summary: Delete customer by ID
 *     tags: [Customer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 *       404:
 *         description: Customer not found
 */
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;