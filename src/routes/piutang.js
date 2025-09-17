const express = require('express');
const router = express.Router();
const piutangController = require('../controllers/piutangController');

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