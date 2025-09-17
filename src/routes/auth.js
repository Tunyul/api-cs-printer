const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 */
router.post('/login', authController.login);
 
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register user (hanya admin)
 *     description: Endpoint ini hanya bisa diakses oleh user dengan role 'admin'.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               nama:
 *                 type: string
 *     responses:
 *       201:
 *         description: Register success
 *       401:
 *         description: Token tidak ditemukan atau tidak valid
 *       403:
 *         description: Hanya admin yang bisa register user baru
 */
router.post('/register', authMiddleware, (req, res, next) => {
	if (req.user.role !== 'admin') {
		return res.status(403).json({ error: 'Hanya admin yang bisa register user baru' });
	}
	next();
}, authController.register);

module.exports = router;
