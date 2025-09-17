const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

/**
 * @swagger
 * tags:
 *   name: Product
 *   description: Product management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id_produk:
 *           type: integer
 *           example: 1
 *         kategori:
 *           type: string
 *           example: Spanduk
 *         nama_produk:
 *           type: string
 *           example: Spanduk Kain
 *         bahan:
 *           type: string
 *           example: Kain
 *         finishing:
 *           type: string
 *           example: Jahit Keliling
 *         ukuran_standar:
 *           type: string
 *           example: 2x1 meter
 *         harga_per_m2:
 *           type: number
 *           format: float
 *           example: 50000.00
 *         harga_per_pcs:
 *           type: number
 *           format: float
 *           example: 25000.00
 *         waktu_proses:
 *           type: string
 *           example: 2 hari
 *         stock:
 *           type: integer
 *           example: 100
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: 2025-09-12T10:00:00Z
 *         updated_at:
 *           type: string
 *           format: date-time
 *           example: 2025-09-12T12:00:00Z
 *     ProductInput:
 *       type: object
 *       required:
 *         - kategori
 *         - nama_produk
 *       properties:
 *         kategori:
 *           type: string
 *           example: Spanduk
 *         nama_produk:
 *           type: string
 *           example: Spanduk Kain
 *         bahan:
 *           type: string
 *           example: Kain
 *         finishing:
 *           type: string
 *           example: Jahit Keliling
 *         ukuran_standar:
 *           type: string
 *           example: 2x1 meter
 *         harga_per_m2:
 *           type: number
 *           format: float
 *           example: 50000.00
 *         harga_per_pcs:
 *           type: number
 *           format: float
 *           example: 25000.00
 *         waktu_proses:
 *           type: string
 *           example: 2 hari
 *         stock:
 *           type: integer
 *           example: 100
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     tags: [Product]
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
router.get('/', productController.getAllProducts);
/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product detail
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
router.get('/:id', productController.getProductById);
/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create new product
 *     tags: [Product]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       201:
 *         description: Product created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid input
 */
router.post('/', productController.createProduct);
/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update product by ID
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Product updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Product not found
 */
router.put('/:id', productController.updateProduct);
/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete product by ID
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Product not found
 */
router.delete('/:id', productController.deleteProduct);

module.exports = router;