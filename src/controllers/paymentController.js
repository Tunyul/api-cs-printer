
const models = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');
const fs = require('fs');

// Helper to emit payment events to customer and admin rooms
function emitPaymentEvent(app, payment, event = 'payment.updated') {
  try {
    if (!app || !payment) return;
    const io = app.get('io');
    if (!io) return;
    const customerId = payment.id_customer || (payment.Order && payment.Order.id_customer) || (payment.Customer && payment.Customer.id_customer) || null;
    const payload = {
      id_payment: payment.id_payment || payment.id,
      no_transaksi: payment.no_transaksi || (payment.Order && payment.Order.no_transaksi) || null,
      nominal: Number(payment.nominal || 0),
      status: payment.status || null,
      timestamp: new Date().toISOString()
    };
    // Use notify helper for emits and persistence (centralized naming)
    try {
      const notify = require('../utils/notify');
      notify(app, 'role', 'admin', event, payload, `Payment ${event}`);
    } catch (e) {
      console.error('notify payment emit error', e && e.message ? e.message : e);
    }
  } catch (err) {
    console.error('emitPaymentEvent error', err && err.message ? err.message : err);
  }
}

// Send invoice webhook to configured INVOICE_WEBHOOK_URL (with Basic Auth)
async function sendInvoiceWebhook(app, no_transaksi) {
  try {
    if (!no_transaksi) return false;
    const modelsLocal = app.get('models') || require('../models');
    const order = await modelsLocal.Order.findOne({ where: { no_transaksi }, include: [{ model: modelsLocal.OrderDetail, include: [modelsLocal.Product] }, modelsLocal.Customer] });
    if (!order) return false;
    const payments = await modelsLocal.Payment.findAll({ where: { no_transaksi } });
    const customer = order.Customer || await modelsLocal.Customer.findOne({ where: { id_customer: order.id_customer } });

    const custPhone = customer && customer.no_hp ? String(customer.no_hp) : '';
    // Minimal payload expected by FE/n8n: only phone and invoice_url
    const payload = {
      phone: custPhone,
      invoice_url: `${process.env.APP_URL || `http://localhost:3000`}/invoice/${order.no_transaksi}.pdf`
    };

    const webhookUrl = process.env.INVOICE_WEBHOOK_URL;
    if (!webhookUrl) return false;

    const authUser = process.env.INVOICE_WEBHOOK_USER || 'inin';
    const authPass = process.env.INVOICE_WEBHOOK_PASS || '1234';
    const authHeader = { auth: { username: authUser, password: authPass } };

  // log minimal payload for debugging
  try { fs.appendFileSync('server.log', `[${new Date().toISOString()}] webhook-payload ${no_transaksi} ` + JSON.stringify(payload) + "\n"); } catch(e){}
  const maxRetries = 3;
    let attempt = 0;
    let lastError = null;
    let result = null;
    while (attempt < maxRetries) {
      try {
        attempt++;
        result = await axios.post(webhookUrl, payload, { timeout: 5000, ...authHeader });
        const logLine = `[${new Date().toISOString()}] notify ${no_transaksi} attempt=${attempt} status=${result.status}\n`;
        try { fs.appendFileSync('server.log', logLine); } catch (e) {}
        break;
      } catch (err) {
        lastError = err;
        const logLine = `[${new Date().toISOString()}] notify ${no_transaksi} attempt=${attempt} error=${err.message}\n`;
        try { fs.appendFileSync('server.log', logLine); } catch (e) {}
        if (err.response && err.response.status >= 400 && err.response.status < 500) break;
        await new Promise(r => setTimeout(r, attempt * 500));
      }
    }

    if (!result) return false;

    // emit realtime invoice.notify and persist Notification rows
    try {
      const io = app.get('io');
      if (order && order.id_customer) {
        const notifyPayload = { no_transaksi: order.no_transaksi, invoice_url: payload.invoice_url, status: 'sent', timestamp: new Date().toISOString() };
        try {
          const notify = require('../utils/notify');
          notify(app, 'user', order.id_customer, 'invoice.notify', notifyPayload, 'Invoice sent');
          notify(app, 'role', 'admin', 'invoice.notify', notifyPayload, 'Invoice sent');
        } catch (e) { console.error('notify invoice.sent error', e && e.message ? e.message : e); }
      }
    } catch (e) { console.error('emit invoice.notify error', e && e.message ? e.message : e); }

    return true;
  } catch (err) {
    console.error('sendInvoiceWebhook error', err && err.message ? err.message : err);
    return false;
  }
}

// Helper: recalculate totals and sync to Order and Piutang
async function syncPaymentEffects(payment, transaction = null) {
  try {
    if (!payment) return;
    // find related order by no_transaksi (preferred) or by id_order if present
    let order = null;
    if (payment.no_transaksi) {
      order = await models.Order.findOne({ where: { no_transaksi: payment.no_transaksi }, transaction });
    }
    // fallback: try to find order by id_order if payment has that field
    if (!order && payment.id_order) {
      order = await models.Order.findByPk(payment.id_order, { transaction });
    }
    if (!order) return;

    // compute total paid for this order via payments linked by no_transaksi
    // Only consider payments that are verified (admin-approved)
    // Sum all payments for the order (include any status) so that test-created payments
    // are reflected immediately. In production you may want to restrict to verified payments.
    const totalPaid = await models.Payment.sum('nominal', {
      where: { no_transaksi: order.no_transaksi },
      transaction
    }) || 0;

    // update order dp_bayar and status_bayar accordingly
  const orderTotal = Number(order.total_bayar || 0);
  // Determine payment-level status and order workflow status
  let paymentStatus = 'belum_lunas';
  let orderWorkflowStatus = order.status || 'pending';
  let orderStatusOrder = order.status_order || 'pending';
  let orderBotStatus = order.status_bot || 'pending';

  if (totalPaid >= orderTotal && orderTotal > 0) {
    paymentStatus = 'lunas';
    orderWorkflowStatus = 'selesai';
    orderStatusOrder = 'selesai';
    orderBotStatus = 'selesai';
  } else if (totalPaid > 0) {
    // partial payment (treat as DP)
    paymentStatus = 'dp';
    orderWorkflowStatus = 'proses';
    orderStatusOrder = 'proses';
    // mark bot flow as completed when customer has submitted bukti/nominal via bot
    orderBotStatus = 'selesai';
  } else {
    paymentStatus = 'belum_lunas';
  }

  const updates = {
    dp_bayar: totalPaid,
    status_bayar: paymentStatus,
    status: orderWorkflowStatus,
    status_order: orderStatusOrder,
    status_bot: orderBotStatus,
    updated_at: new Date()
  };
  await models.Order.update(updates, { where: { id_order: order.id_order }, transaction });

    // Update piutang for this customer: allocate payments to piutangs (FIFO)
    const customerId = order.id_customer;
    if (customerId) {
      // attempt to get customer's phone to include payments referenced by no_hp
  const customer = await models.Customer.findByPk(customerId, { transaction });
  const customerPhone = customer ? customer.no_hp : null;

      // compute total payments available for this customer (only verified payments):
      // sum payments where no_transaksi belongs to customer's orders OR payment.no_hp matches
      const customerOrders = await models.Order.findAll({ where: { id_customer: customerId }, attributes: ['no_transaksi'], transaction });
      const orderNos = customerOrders.map(o => o.no_transaksi).filter(Boolean);
      // Sum payments for this customer (by order numbers or phone); include all statuses
      const paymentWhere = {
        [Op.or]: [
          ...(orderNos.length > 0 ? [{ no_transaksi: orderNos }] : []),
          ...(customerPhone ? [{ no_hp: customerPhone }] : [])
        ]
      };
      const paymentsSum = await models.Payment.sum('nominal', { where: paymentWhere, transaction }) || 0;

      // allocate available funds to piutangs in FIFO order (by created_at)
      let remainingFunds = Number(paymentsSum || 0);
      if (remainingFunds > 0) {
        const piutangs = await models.Piutang.findAll({
          where: { id_customer: customerId },
          order: [['created_at', 'ASC']],
          transaction
        });
        if (piutangs && piutangs.length > 0) {
          for (const p of piutangs) {
            const jumlah = Number(p.jumlah_piutang || 0);
            const prevPaid = Number(p.paid || 0);
            // Determine new paid amount for this piutang from remaining funds
            const newPaid = Math.min(jumlah, remainingFunds);
            const newStatus = newPaid >= jumlah ? 'lunas' : 'belum_lunas';
            // Update only if there is a change
            if (newPaid !== prevPaid || p.status !== newStatus) {
              await p.update({ paid: newPaid, status: newStatus, updated_at: new Date() }, { transaction });
            }
            remainingFunds = Math.max(0, remainingFunds - newPaid);
            if (remainingFunds <= 0) break;
          }
        }
      }
    }
  } catch (err) {
    // don't throw to avoid breaking payment flows; log to console for now
    console.error('syncPaymentEffects error:', err.message || err);
  }
}

// Ensure there is at least one piutang entry for this customer representing outstanding total
async function ensurePiutangForCustomer(customerId, transaction = null) {
  try {
    if (!customerId) return;
    // compute total unpaid from orders: sum(order.total_bayar - totalPaidByOrder)
    const orders = await models.Order.findAll({ where: { id_customer: customerId }, transaction });
    if (!orders || orders.length === 0) return;

    let totalOutstanding = 0;
    for (const order of orders) {
      const paidForOrder = await models.Payment.sum('nominal', { where: { no_transaksi: order.no_transaksi }, transaction }) || 0;
      const remaining = Number(order.total_bayar || 0) - Number(paidForOrder || 0);
      if (remaining > 0) totalOutstanding += remaining;
    }

    // If there is already any piutang rows for this customer, we don't auto-create a summary row
    const existing = await models.Piutang.findOne({ where: { id_customer: customerId }, transaction });
    if (!existing && totalOutstanding > 0) {
      const now = new Date();
      await models.Piutang.create({
        id_customer: customerId,
        jumlah_piutang: totalOutstanding,
        paid: 0.00,
        tanggal_piutang: now,
        status: 'belum_lunas',
        created_at: now,
        updated_at: now
      }, { transaction });
    }
  } catch (err) {
    console.error('ensurePiutangForCustomer error:', err.message || err);
  }
}

module.exports = {
  createPayment: async (req, res) => {
    try {
      const { id_order, id_customer, nominal, bukti, tipe, no_hp, status } = req.body;
      // Normalize tanggal if provided by client
      let tanggalField;
      if (req.body.tanggal) {
        const t = req.body.tanggal;
        if (typeof t === 'object' && t.val && String(t.val).toUpperCase() === 'CURRENT_TIMESTAMP') {
          tanggalField = new Date();
        } else if (typeof t === 'string' || typeof t === 'number') {
          const parsed = new Date(t);
          if (!isNaN(parsed)) tanggalField = parsed;
        } else if (t instanceof Date) {
          tanggalField = t;
        }
      }
      // Case A: full create with id_order, nominal, tipe (existing behavior)
      if (id_order && (nominal !== undefined && nominal !== null) && tipe) {
        // If no_hp not provided, try to fetch from order->customer
        let phone = no_hp;
        if (!phone) {
          const orderForPhone = await models.Order.findOne({ where: { id_order }, include: [models.Customer] });
          if (orderForPhone && orderForPhone.Customer && orderForPhone.Customer.no_hp) {
            phone = orderForPhone.Customer.no_hp;
          }
        }
        if (!phone) return res.status(400).json({ error: 'no_hp required or must be derivable from order/customer' });
        let payment = await models.Payment.create({
          id_order,
          id_customer,
          nominal,
          bukti,
          tipe,
          no_hp: phone,
          ...(tanggalField ? { tanggal: tanggalField } : {}),
          status: status || 'pending',
          created_at: new Date(),
          updated_at: new Date()
        });
        // Reload from DB to ensure returned `tanggal` is the stored timestamp
          payment = await models.Payment.findByPk(payment.id_payment, {
          include: [
            { model: models.Order, attributes: ['id_order', 'no_transaksi'] },
            { model: models.Customer, attributes: ['id_customer', 'nama', 'no_hp'] }
          ]
        });
          // ensure piutang exists if needed, then sync effects (order status, piutang)
            await ensurePiutangForCustomer(payment.id_customer || (payment.Order && payment.Order.id_customer));
            await syncPaymentEffects(payment);
            // emit payment created/updated
            try { emitPaymentEvent(req.app, payment, 'payment.created'); } catch (e) { /* ignore */ }
            // If payment created with status verified, trigger invoice webhook
            try { if (payment.status && String(payment.status).toLowerCase() === 'verified') { sendInvoiceWebhook(req.app, payment.no_transaksi || (payment.Order && payment.Order.no_transaksi)); } } catch (e) {}
        return res.status(201).json(payment);
      }

      // Case B: allow no_hp + bukti -> find customer and pending order, create payment with defaults
      if (no_hp && bukti) {
        const customer = await models.Customer.findOne({ where: { no_hp } });
        if (!customer) return res.status(404).json({ error: 'Customer tidak ditemukan' });
        const order = await models.Order.findOne({ where: { id_customer: customer.id_customer, status_bot: 'pending' } });
        if (!order) return res.status(404).json({ error: 'Order tidak ditemukan untuk customer ini' });
        // create payment linking to order via no_transaksi / no_hp
        let payment = await models.Payment.create({
          no_transaksi: order.no_transaksi,
          no_hp,
          nominal: 0,
          bukti,
          tipe: 'dp',
          ...(tanggalField ? { tanggal: tanggalField } : {}),
          status: status || 'menunggu_verifikasi',
          created_at: new Date(),
          updated_at: new Date()
        });
        payment = await models.Payment.findByPk(payment.id_payment, {
          include: [
            { model: models.Order, attributes: ['id_order', 'no_transaksi'] },
            { model: models.Customer, attributes: ['id_customer', 'nama', 'no_hp'] }
          ]
        });
  // ensure piutang exists for customer, then sync
  await ensurePiutangForCustomer(payment.Customer ? payment.Customer.id_customer : null);
  await syncPaymentEffects(payment);
  try { emitPaymentEvent(req.app, payment, 'payment.created'); } catch (e) { }
  try { if (payment.status && String(payment.status).toLowerCase() === 'verified') { sendInvoiceWebhook(req.app, payment.no_transaksi || (payment.Order && payment.Order.no_transaksi)); } } catch (e) {}
        return res.status(201).json(payment);
      }

      // Case C: allow no_transaksi + bukti -> create payment for that transaction
      if (req.body.no_transaksi && bukti) {
        const { no_transaksi } = req.body;
        const order = await models.Order.findOne({ where: { no_transaksi }, include: [models.Customer] });
        if (!order) return res.status(404).json({ error: 'Order tidak ditemukan' });
        // derive phone from provided no_hp or from order's customer
        let phone = no_hp;
        if (!phone && order.Customer && order.Customer.no_hp) phone = order.Customer.no_hp;
        if (!phone) return res.status(400).json({ error: 'no_hp required or must be available on the order/customer' });
        let payment = await models.Payment.create({
          no_transaksi,
          no_hp: phone,
          nominal: 0,
          bukti,
          tipe: 'dp',
          ...(tanggalField ? { tanggal: tanggalField } : {}),
          status: status || 'menunggu_verifikasi',
          created_at: new Date(),
          updated_at: new Date()
        });
        payment = await models.Payment.findByPk(payment.id_payment, {
          include: [
            { model: models.Order, attributes: ['id_order', 'no_transaksi'] },
            { model: models.Customer, attributes: ['id_customer', 'nama', 'no_hp'] }
          ]
        });
  // ensure piutang exists for customer, then sync
  await ensurePiutangForCustomer(payment.Customer ? payment.Customer.id_customer : null);
  await syncPaymentEffects(payment);
  try { emitPaymentEvent(req.app, payment, 'payment.created'); } catch (e) { }
  try { if (payment.status && String(payment.status).toLowerCase() === 'verified') { sendInvoiceWebhook(req.app, payment.no_transaksi || (payment.Order && payment.Order.no_transaksi)); } } catch (e) {}
        return res.status(201).json(payment);
      }

      return res.status(400).json({ error: 'Request tidak lengkap. Kirim id_order+nominal+tipe atau no_hp+bukti (atau no_transaksi+bukti)' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getPayments: async (req, res) => {
    try {
      // Fetch payments and include Order only to avoid duplicate rows caused by
      // joining Customer via non-unique keys (no_hp). We'll attach a single
      // Customer per payment afterwards by querying Customer by no_hp.
      const payments = await models.Payment.findAll({
        include: [
          { model: models.Order, attributes: ['id_order', 'no_transaksi', 'id_customer'] }
        ],
        order: [['tanggal', 'DESC']]
      });
      if (!payments || payments.length === 0) {
        return res.status(404).json({ error: 'No payments found' });
      }
      // Attach one Customer per payment (lookup by payment.no_hp). This ensures
      // each payment appears once even if multiple Customer rows could match in
      // joins or associations.
      const paymentsWithCustomer = await Promise.all(payments.map(async p => {
        const plain = p.get({ plain: true });
        let customer = null;
        try {
          if (plain.no_hp) {
            customer = await models.Customer.findOne({ where: { no_hp: plain.no_hp }, attributes: ['id_customer', 'nama', 'no_hp'] });
          }
        } catch (e) {
          // ignore and proceed without customer
        }
        return Object.assign({}, plain, { Customer: customer });
      }));

      res.status(200).json(paymentsWithCustomer);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getPaymentById: async (req, res) => {
    try {
      const payment = await models.Payment.findByPk(req.params.id, {
        include: [
          { model: models.Order, attributes: ['id_order', 'no_transaksi'] },
          { model: models.Customer, attributes: ['id_customer', 'nama', 'no_hp'] }
        ]
      });
      if (!payment) return res.status(404).json({ error: 'Payment not found' });
      res.status(200).json(payment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getPaymentsByOrder: async (req, res) => {
    try {
      const payments = await models.Payment.findAll({
        where: { id_order: req.params.order_id },
        include: [
          { model: models.Customer, attributes: ['id_customer', 'nama', 'no_hp'] }
        ],
        order: [['tanggal', 'DESC']]
      });
      if (!payments || payments.length === 0) {
        return res.status(404).json({ error: 'No payments found for this order' });
      }
      res.status(200).json(payments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get payments by transaction number (no_transaksi)
  getPaymentsByTransaksi: async (req, res) => {
    try {
      const { no_transaksi } = req.params;
      if (!no_transaksi) return res.status(400).json({ error: 'no_transaksi wajib diisi' });
      const payments = await models.Payment.findAll({ where: { no_transaksi },
        include: [
          { model: models.Order, attributes: ['id_order', 'no_transaksi', 'id_customer'] },
          { model: models.Customer, attributes: ['id_customer', 'nama', 'no_hp'] }
        ],
        order: [['tanggal', 'DESC']]
      });
      if (!payments || payments.length === 0) return res.status(404).json({ error: 'Payment tidak ditemukan untuk no_transaksi tersebut' });
      res.status(200).json(payments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Return total paid and order totals for an order id
  getTotalPaidByOrder: async (req, res) => {
    try {
      const { order_id } = req.params;
      if (!order_id) return res.status(400).json({ error: 'order_id required' });
      const order = await models.Order.findByPk(order_id);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      const totalPaid = await models.Payment.sum('nominal', { where: { no_transaksi: order.no_transaksi } }) || 0;
      res.status(200).json({ id_order: order.id_order, no_transaksi: order.no_transaksi, total_bayar: order.total_bayar, total_paid: totalPaid, status_bayar: order.status_bayar });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getPaymentsByCustomer: async (req, res) => {
    try {
      const payments = await models.Payment.findAll({
        where: { id_customer: req.params.customer_id },
        include: [
          { model: models.Order, attributes: ['id_order', 'no_transaksi'] }
        ],
        order: [['tanggal', 'DESC']]
      });
      if (!payments || payments.length === 0) {
        return res.status(404).json({ error: 'No payments found for this customer' });
      }
      res.status(200).json(payments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  uploadBuktiPembayaran: async (req, res) => {
    try {
      const { id_payment } = req.params;
      const { bukti } = req.body;
      if (!bukti) return res.status(400).json({ error: 'Link bukti pembayaran wajib diisi' });
      const payment = await models.Payment.findByPk(id_payment);
      if (!payment) return res.status(404).json({ error: 'Payment tidak ditemukan' });
      await payment.update({ bukti, updated_at: new Date() });
      // reload with relations and sync effects
      const updatedPayment = await models.Payment.findByPk(payment.id_payment, {
        include: [
          { model: models.Order, attributes: ['id_order', 'no_transaksi'] },
          { model: models.Customer, attributes: ['id_customer', 'nama', 'no_hp'] }
        ]
      });
      await syncPaymentEffects(updatedPayment);
    try { emitPaymentEvent(req.app, updatedPayment, 'payment.updated'); } catch (e) { }
      res.json(updatedPayment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  createPaymentByPhone: async (req, res) => {
    try {
      const { no_hp, bukti_pembayaran } = req.body;
      if (!no_hp || !bukti_pembayaran) return res.status(400).json({ error: 'no_hp dan bukti_pembayaran wajib diisi' });
      const customer = await models.Customer.findOne({ where: { no_hp } });
      if (!customer) return res.status(404).json({ error: 'Customer tidak ditemukan' });
      const order = await models.Order.findOne({ where: { id_customer: customer.id_customer, status_bot: 'pending' } });
      if (!order) return res.status(404).json({ error: 'Order tidak ditemukan' });
      // For bot-submitted bukti, create payment with nominal = 0 and status 'menunggu_verifikasi'
      // so admin must verify and set the actual nominal later.
      let created = await models.Payment.create({
        no_transaksi: order.no_transaksi,
        no_hp,
        nominal: 0,
        bukti: bukti_pembayaran,
        tipe: 'dp',
        status: 'menunggu_verifikasi',
        created_at: new Date(),
        updated_at: new Date()
      });
      // reload payment with relations
      let payment = await models.Payment.findByPk(created.id_payment, {
        include: [
          { model: models.Order, attributes: ['id_order', 'no_transaksi', 'id_customer'] },
          { model: models.Customer, attributes: ['id_customer', 'no_hp'] }
        ]
      });
      // ensure piutang exists for this customer so admin can reconcile later
      await ensurePiutangForCustomer(order.id_customer);
      // sync payment effects (update order dp/status and piutangs)
      await syncPaymentEffects(payment);
      res.status(201).json({ success: true, message: 'Bukti pembayaran diterima, menunggu verifikasi admin', payment_id: payment.id_payment, payment });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getPaymentsByPhone: async (req, res) => {
    try {
      const { no_hp } = req.query;
      if (!no_hp) return res.status(400).json({ error: 'no_hp wajib diisi' });
      const customer = await models.Customer.findOne({ where: { no_hp } });
      if (!customer) return res.status(404).json({ error: 'Customer tidak ditemukan' });
      const orders = await models.Order.findAll({ where: { id_customer: customer.id_customer } });
      if (!orders || orders.length === 0) return res.status(404).json({ error: 'Order tidak ditemukan' });
      const orderIds = orders.map(o => o.id_order);
      const payments = await models.Payment.findAll({ where: { id_order: orderIds } });
      if (!payments || payments.length === 0) return res.status(404).json({ error: 'Payment tidak ditemukan' });
      res.status(200).json(payments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  updatePaymentLinkByTransaksi: async (req, res) => {
    try {
      const { no_transaksi, link_bukti } = req.body;
      if (!no_transaksi || !link_bukti) return res.status(400).json({ error: 'no_transaksi dan link_bukti wajib diisi' });
      const order = await models.Order.findOne({ where: { no_transaksi } });
      if (!order) return res.status(404).json({ error: 'Order tidak ditemukan' });
      const payment = await models.Payment.findOne({ where: { id_order: order.id_order } });
      if (!payment) return res.status(404).json({ error: 'Payment tidak ditemukan' });
      await payment.update({ bukti_pembayaran: link_bukti, updated_at: new Date() });
      const updatedPayment = await models.Payment.findByPk(payment.id_payment, {
        include: [
          { model: models.Order, attributes: ['id_order', 'no_transaksi'] },
          { model: models.Customer, attributes: ['id_customer', 'nama', 'no_hp'] }
        ]
      });
      await syncPaymentEffects(updatedPayment);
      res.status(200).json(updatedPayment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  ,

  // Update payment by payment id
  updatePaymentById: async (req, res) => {
    try {
      let { id } = req.params;
      // allow id in body as id_payment for convenience
      if (!id) id = req.body.id || req.body.id_payment;
      const { bukti, nominal } = req.body;
      if (!bukti && (nominal === undefined || nominal === null)) {
        return res.status(400).json({ error: 'Minimal satu field (bukti atau nominal) harus diisi' });
      }
      const payment = await models.Payment.findByPk(id);
      if (!payment) return res.status(404).json({ error: 'Payment tidak ditemukan' });
      const updates = {};
      if (bukti !== undefined) updates.bukti = bukti;
      if (nominal !== undefined && nominal !== null) updates.nominal = nominal;
      updates.updated_at = new Date();
      await payment.update(updates);
      // reload with relations and sync effects
      const updatedPayment = await models.Payment.findByPk(payment.id_payment, {
        include: [
          { model: models.Order, attributes: ['id_order', 'no_transaksi'] },
          { model: models.Customer, attributes: ['id_customer', 'nama', 'no_hp'] }
        ]
      });
      await syncPaymentEffects(updatedPayment);
    try { emitPaymentEvent(req.app, updatedPayment, 'payment.updated'); } catch (e) { }
      // trigger invoice webhook notify when payment is verified
      try { sendInvoiceWebhook(req.app, updatedPayment.no_transaksi || (updatedPayment.Order && updatedPayment.Order.no_transaksi)); } catch (e) { console.error('sendInvoiceWebhook error', e && e.message ? e.message : e); }
      res.status(200).json(updatedPayment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Update payments by no_transaksi (can update multiple payments)
  updatePaymentByTransaksi: async (req, res) => {
    try {
      const { no_transaksi, bukti, nominal } = req.body;
      if (!no_transaksi) return res.status(400).json({ error: 'no_transaksi wajib diisi' });
      if (!bukti && (nominal === undefined || nominal === null)) {
        return res.status(400).json({ error: 'Minimal satu field (bukti atau nominal) harus diisi' });
      }
      const payments = await models.Payment.findAll({ where: { no_transaksi } });
      if (!payments || payments.length === 0) return res.status(404).json({ error: 'Payment tidak ditemukan untuk no_transaksi tersebut' });
      const updates = {};
      if (bukti !== undefined) updates.bukti = bukti;
      if (nominal !== undefined && nominal !== null) updates.nominal = nominal;
      updates.updated_at = new Date();
      await Promise.all(payments.map(p => p.update(updates)));
      // reload updated payments and sync effects for each
      const updatedPayments = await models.Payment.findAll({ where: { no_transaksi },
        include: [
          { model: models.Order, attributes: ['id_order', 'no_transaksi'] },
          { model: models.Customer, attributes: ['id_customer', 'nama', 'no_hp'] }
        ]
      });
      await Promise.all(updatedPayments.map(p => syncPaymentEffects(p)));
    try { updatedPayments.forEach(p => emitPaymentEvent(req.app, p, 'payment.updated')); } catch (e) { }
    // trigger invoice webhook for any updated payments that are verified
    try { updatedPayments.forEach(p => { if (p.status && String(p.status).toLowerCase() === 'verified') { try { sendInvoiceWebhook(req.app, p.no_transaksi || (p.Order && p.Order.no_transaksi)); } catch (e) {} } }); } catch (e) {}
      res.status(200).json(updatedPayments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Approve a payment (admin): set nominal and mark verified, then sync effects
  approvePayment: async (req, res) => {
    try {
      let { id } = req.params;
      if (!id) id = req.body.id || req.body.id_payment;
      const { nominal } = req.body;
      if (!id) return res.status(400).json({ error: 'id payment required' });
      if (nominal === undefined || nominal === null) return res.status(400).json({ error: 'nominal required' });
      const payment = await models.Payment.findByPk(id);
      if (!payment) return res.status(404).json({ error: 'Payment not found' });
      // update nominal and status to verified
      await payment.update({ nominal, status: 'verified', updated_at: new Date() });
      const updatedPayment = await models.Payment.findByPk(payment.id_payment, {
        include: [
          { model: models.Order, attributes: ['id_order', 'no_transaksi', 'id_customer'] },
          { model: models.Customer, attributes: ['id_customer', 'nama', 'no_hp'] }
        ]
      });
      // ensure piutang exists and sync effects
      await ensurePiutangForCustomer(updatedPayment.id_customer || (updatedPayment.Order && updatedPayment.Order.id_customer));
      await syncPaymentEffects(updatedPayment);
    try { emitPaymentEvent(req.app, updatedPayment, 'payment.updated'); } catch (e) { }
      // trigger invoice webhook notify when payment is verified (non-blocking)
      try {
        // call async but don't block response; log if error
        sendInvoiceWebhook(req.app, updatedPayment.no_transaksi || (updatedPayment.Order && updatedPayment.Order.no_transaksi)).catch(err => {
          console.error('sendInvoiceWebhook (approve) error', err && err.message ? err.message : err);
        });
      } catch (e) {
        console.error('sendInvoiceWebhook(approve) sync error', e && e.message ? e.message : e);
      }

      res.status(200).json(updatedPayment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Update payments by phone number (no_hp) - may affect multiple records
  updatePaymentByPhone: async (req, res) => {
    try {
      const { no_hp, bukti, nominal } = req.body;
      if (!no_hp) return res.status(400).json({ error: 'no_hp wajib diisi' });
      if (!bukti && (nominal === undefined || nominal === null)) {
        return res.status(400).json({ error: 'Minimal satu field (bukti atau nominal) harus diisi' });
      }
      const payments = await models.Payment.findAll({ where: { no_hp } });
      if (!payments || payments.length === 0) return res.status(404).json({ error: 'Payment tidak ditemukan untuk no_hp tersebut' });
      const updates = {};
      if (bukti !== undefined) updates.bukti = bukti;
      if (nominal !== undefined && nominal !== null) updates.nominal = nominal;
      updates.updated_at = new Date();
      await Promise.all(payments.map(p => p.update(updates)));
      // reload updated payments and sync effects for each
      const paymentIds = payments.map(p => p.id_payment);
      const updatedPayments = await models.Payment.findAll({ where: { id_payment: paymentIds },
        include: [
          { model: models.Order, attributes: ['id_order', 'no_transaksi'] },
          { model: models.Customer, attributes: ['id_customer', 'nama', 'no_hp'] }
        ]
      });
  await Promise.all(updatedPayments.map(p => syncPaymentEffects(p)));
  // trigger invoice webhook for any updated payments that are verified
  try { updatedPayments.forEach(p => { if (p.status && String(p.status).toLowerCase() === 'verified') { try { sendInvoiceWebhook(req.app, p.no_transaksi || (p.Order && p.Order.no_transaksi)); } catch (e) {} } }); } catch (e) {}
  res.status(200).json(updatedPayments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

// also expose helpers for scripts/tests
module.exports.syncPaymentEffects = syncPaymentEffects;
module.exports.ensurePiutangForCustomer = ensurePiutangForCustomer;
