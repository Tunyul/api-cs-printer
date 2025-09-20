'use strict';
const express = require('express');
const router = express.Router();
const controller = require('../controllers/publicInvoiceController');
const auth = require('../middleware/auth');

// Public invoice access by transaction number (PDF)
router.get('/:no_transaksi.pdf', controller.getInvoicePdf);

// Notify webhook (protected)
router.post('/:no_transaksi/notify', auth, controller.postNotifyWebhook);

module.exports = router;
