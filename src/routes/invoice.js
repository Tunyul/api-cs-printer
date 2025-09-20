'use strict';
const express = require('express');
const router = express.Router();
const controller = require('../controllers/invoiceController');
const auth = require('../middleware/auth');

// Create token - protected (Bot/Admin)
router.post('/', auth, controller.createInvoiceToken);

// Public fetch by token
router.get('/token/:token', controller.getInvoiceByToken);

// Revoke token - admin only
router.delete('/token/:token', auth, controller.deleteInvoiceToken);

module.exports = router;
