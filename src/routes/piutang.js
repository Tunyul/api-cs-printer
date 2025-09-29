const express = require('express');
const router = express.Router();
const piutangController = require('../controllers/piutangController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

/**
 * @swagger
 * tags:
 *   name: Piutang
 *   description: Piutang management
 */

/**
 * @swagger
 * /api/piutangs:
 *   get:
 *     summary: Get all piutangs
 *     tags: [Piutang]
 *     responses:
 *       200:
 *         description: List of piutangs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Piutang'
 */
router.get('/', piutangController.getAllPiutangs);
/**
 * @swagger
 * /api/piutangs/{id}:
 *   get:
 *     summary: Get piutang by ID
 *     tags: [Piutang]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Piutang ID
 *     responses:
 *       200:
 *         description: Piutang detail
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Piutang'
 *       404:
 *         description: Piutang not found
 */
router.get('/:id', piutangController.getPiutangById);

// Get allocations for a specific piutang
/**
 * @swagger
 * /api/piutangs/{id}/allocations:
 *   get:
 *     summary: Get payment allocations by piutang ID
 *     tags: [Piutang]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Piutang ID
 *     responses:
 *       200:
 *         description: List of allocations
 *       400:
 *         description: Missing id
 */
router.get('/:id/allocations', auth, admin, async (req, res) => {
	try {
		const id = req.params.id;
		if (!id) return res.status(400).json({ error: 'id piutang required' });
		const models = require('../models');
		const allocs = await models.PaymentAllocation.findAll({ where: { id_piutang: id }, order: [['tanggal_alloc','DESC']] });
		res.status(200).json(allocs);
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});
/**
 * @swagger
 * /api/piutangs:
 *   post:
 *     summary: Create piutang
 *     tags: [Piutang]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Piutang'
 *     responses:
 *       201:
 *         description: Piutang created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Piutang'
 *       400:
 *         description: Invalid input
 */
router.post('/', piutangController.createPiutang);
/**
 * @swagger
 * /api/piutangs/{id}:
 *   put:
 *     summary: Update piutang by ID
 *     tags: [Piutang]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Piutang ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Piutang'
 *     responses:
 *       200:
 *         description: Piutang updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Piutang'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Piutang not found
 */
router.put('/:id', piutangController.updatePiutang);
/**
 * @swagger
 * /api/piutangs/{id}:
 *   delete:
 *     summary: Delete piutang by ID
 *     tags: [Piutang]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Piutang ID
 *     responses:
 *       204:
 *         description: Piutang deleted
 *       404:
 *         description: Piutang not found
 */
router.delete('/:id', piutangController.deletePiutang);

module.exports = router;