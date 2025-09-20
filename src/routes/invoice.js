'use strict';
const express = require('express');
const router = express.Router();
const controller = require('../controllers/invoiceController');
const publicController = require('../controllers/publicInvoiceController');
const auth = require('../middleware/auth');

// Create token - protected (Bot/Admin)
router.post('/', auth, controller.createInvoiceToken);

// Public fetch by token
router.get('/token/:token', controller.getInvoiceByToken);

// Revoke token - admin only
router.delete('/token/:token', auth, controller.deleteInvoiceToken);

// Optional notify webhook via BE (protected)
router.post('/:no_transaksi/notify', auth, publicController.postNotifyWebhook);

module.exports = router;
