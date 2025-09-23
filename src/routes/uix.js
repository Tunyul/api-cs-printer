const express = require('express');
const router = express.Router();
const uixController = require('../controllers/uixController');

/**
 * @swagger
 * tags:
 *   - name: Uix
 *     description: UIX test table endpoints
 *
 *
 */

/**
 * @swagger
 * /api/uix:
 *   get:
 *     summary: List Uix items
 *     tags: [Uix]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Uix'
 */
router.get('/', uixController.list);

/**
 * @swagger
 * /api/uix/{id}:
 *   get:
 *     summary: Get Uix item by ID
 *     tags: [Uix]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Uix detail
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Uix'
 *       404:
 *         description: Not found
 */
router.get('/:id', uixController.getById);

/**
 * @swagger
 * /api/uix:
 *   post:
 *     summary: Create a new Uix item
 *     tags: [Uix]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Uix'
 *     responses:
 *       201:
 *         description: created
 */
router.post('/', uixController.create);

/**
 * @swagger
 * /api/uix/{id}:
 *   put:
 *     summary: Update Uix item
 *     tags: [Uix]
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
 *             $ref: '#/components/schemas/Uix'
 *     responses:
 *       200:
 *         description: updated
 */
router.put('/:id', uixController.update);

/**
 * @swagger
 * /api/uix/{id}:
 *   delete:
 *     summary: Delete Uix item
 *     tags: [Uix]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: deleted
 */
router.delete('/:id', uixController.remove);

module.exports = router;
