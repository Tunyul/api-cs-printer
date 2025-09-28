
const models = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');
const fs = require('fs');

// In-memory dedupe cache to avoid sending the same invoice webhook multiple
// times within a short window (useful because multiple call sites may call
// sendInvoiceWebhook for the same transaction during one update flow).
// Key: no_transaksi -> timestamp ms when last sent
const _invoiceSendCache = new Map();
const INVOICE_WEBHOOK_DEDUP_MS = Number(process.env.INVOICE_WEBHOOK_DEDUP_MS || 10000);

function shouldSkipInvoiceSend(no_transaksi) {
  if (!no_transaksi) return false;
  try {
    const now = Date.now();
    const last = _invoiceSendCache.get(no_transaksi);
    if (last && (now - last) < INVOICE_WEBHOOK_DEDUP_MS) {
      return true;
    }
    _invoiceSendCache.set(no_transaksi, now);
    // cleanup old entries occasionally
    if (_invoiceSendCache.size > 1000) {
      for (const [k, v] of _invoiceSendCache) {
        if ((now - v) > INVOICE_WEBHOOK_DEDUP_MS * 5) _invoiceSendCache.delete(k);
      }
    }
  } catch (e) {
    // ignore cache errors
  }
  return false;
}

// Wrapper that applies dedupe logic then calls the real sender
async function sendInvoiceWebhookOnce(app, no_transaksi) {
  try {
    if (!no_transaksi) return false;
    if (shouldSkipInvoiceSend(no_transaksi)) return false;
    return await sendInvoiceWebhook(app, no_transaksi);
  } catch (e) {
    console.error('sendInvoiceWebhookOnce error', e && e.message ? e.message : e);
    return false;
  }
}

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

// Helper: if syncPaymentEffects returns isFullyPaid, and payment.tipe was 'dp', set it to 'pelunasan'
async function setPaymentTypeIfFullyPaid(paymentInstance, effects, transaction = null) {
  try {
    if (!paymentInstance || !effects) return;
    if (effects.isFullyPaid && paymentInstance.tipe && String(paymentInstance.tipe).toLowerCase() === 'dp') {
      await paymentInstance.update({ tipe: 'pelunasan', updated_at: new Date() }, { transaction });
    }
  } catch (e) {
    // ignore
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
    const getAppUrl = require('../utils/getAppUrl');
    const payload = {
      phone: custPhone,
  invoice_url: `${getAppUrl()}/invoice/${order.no_transaksi}.pdf`
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
async function syncPaymentEffects(payment, transaction = null, options = {}) {
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
  const skipOrderStatusUpdate = options && options.skipOrderStatusUpdate;

  if (totalPaid >= orderTotal && orderTotal > 0) {
    paymentStatus = 'lunas';
    // Only skip updating the public `status` field when requested. Keep
    // internal order flow fields (`status_order` and `status_bot`) in sync so
    // administrative flows and UI that depend on them still work.
    if (!skipOrderStatusUpdate) {
      orderWorkflowStatus = 'selesai';
    }
    orderStatusOrder = 'selesai';
    orderBotStatus = 'selesai';
  } else if (totalPaid > 0) {
    // partial payment (treat as DP)
    paymentStatus = 'dp';
    if (!skipOrderStatusUpdate) {
      orderWorkflowStatus = 'proses';
    }
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
  // reload the order to get actual stored values (respecting any skip flags)
  const reloadedOrder = await models.Order.findByPk(order.id_order, { transaction });

    // If order becomes selesai, send external webhook (non-blocking)
    try {
      const skipOrderWebhook = options && options.skipOrderWebhook;
      // Only send "pesan anda selesai" webhook when the actual `status` column is 'selesai'
      if (!skipOrderWebhook && reloadedOrder && reloadedOrder.status === 'selesai') {
        const orderWebhook = require('../utils/orderWebhook');
        const customer = await models.Customer.findByPk(order.id_customer, { transaction });
        const phone = customer ? customer.no_hp : null;
        const customerName = customer ? customer.nama : '';
  const invoiceUrl = `${process.env.APP_URL || 'http://localhost:3000'}/invoice/${order.no_transaksi}.pdf`;
        orderWebhook.sendOrderCompletedWebhook(phone, customerName, order.no_transaksi, invoiceUrl).catch(() => {});
      }
    } catch (e) {}

  // Update piutang for this customer: allocate payments to piutangs (FIFO)
  // Derive customerId defensively from order or payment (if available). If
  // we cannot determine a customerId, skip allocation to avoid passing
  // undefined into Sequelize where clauses.
  const customerId = (order && order.id_customer) || (payment && payment.id_customer) || (payment && payment.Customer && payment.Customer.id_customer) || null;
  if (customerId) {
      // attempt to get customer's phone to include payments referenced by no_hp
    const customer = await models.Customer.findByPk(customerId, { transaction });
    const customerPhone = customer ? customer.no_hp : null;

      // compute total payments available for this customer (only verified payments):
      // By default this used to allocate using the SUM of all payments for the customer.
      // Change: when this function is called for a specific payment (usePaymentAmount=true)
      // allocate only from that payment's nominal so allocation history is attributed
      // to the actual payment that provided the funds.
      const customerOrders = await models.Order.findAll({ where: { id_customer: customerId }, attributes: ['no_transaksi'], transaction });
      const orderNos = customerOrders.map(o => o.no_transaksi).filter(Boolean);

      // If caller requested to use only the passed payment's amount, use that.
      let remainingFunds = 0;
      if (options && options.usePaymentAmount && payment) {
        remainingFunds = Number(payment.nominal || 0);
      } else {
        // Sum payments for this customer (by order numbers or phone); include all statuses
        const paymentWhere = {
          [Op.or]: [
            ...(orderNos.length > 0 ? [{ no_transaksi: orderNos }] : []),
            ...(customerPhone ? [{ no_hp: customerPhone }] : [])
          ]
        };
        const paymentsSum = await models.Payment.sum('nominal', { where: paymentWhere, transaction }) || 0;
        remainingFunds = Number(paymentsSum || 0);
      }
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
            // Compute how much is still owed for this piutang, then allocate from remainingFunds
            const remainingForThis = Math.max(0, jumlah - prevPaid);
            const allocation = Math.min(remainingForThis, remainingFunds);
              const newPaid = prevPaid + allocation;
              // By default, mark as lunas only if fully paid
              let newStatus = newPaid >= jumlah ? 'lunas' : 'belum_lunas';
              // Extra rule: do not mark piutang 'lunas' if the related order's dp_bayar
              // has not reached the order total. This prevents marking debts as fully
              // settled when the order itself is not yet considered fully paid.
              try {
                if (newStatus === 'lunas' && p.id_order) {
                  const relatedOrder = await models.Order.findByPk(p.id_order, { transaction });
                  if (relatedOrder) {
                    const orderDp = Number(relatedOrder.dp_bayar || 0);
                    const orderTotal = Number(relatedOrder.total_bayar || 0);
                    if (orderDp < orderTotal) {
                      // keep as belum_lunas until order's dp_bayar meets total
                      newStatus = 'belum_lunas';
                    }
                  }
                }
              } catch (e) {
                // If any error occurs while checking order, fall back to previous behavior
              }
              // Update only if allocation changed paid or status changed
              if (allocation > 0 || p.status !== newStatus) {
                // persist allocation history (hybrid approach)
                try {
                  if (allocation > 0 && models.PaymentAllocation) {
                    await models.PaymentAllocation.create({ id_payment: payment.id_payment || payment.id, id_piutang: p.id_piutang || p.id, amount: allocation, tanggal_alloc: new Date() }, { transaction });
                  }
                } catch (e) {
                  // don't fail overall flow if allocation history insert fails
                  console.error('payment allocation insert failed', e && e.message ? e.message : e);
                }
                await p.update({ paid: newPaid, status: newStatus, updated_at: new Date() }, { transaction });
                // Optional: remove or zero-out piutang rows when fully paid.
                // Controlled via environment variables to keep behavior backward-compatible.
                try {
                  if (newStatus === 'lunas') {
                    // If PIUTANG_REMOVE_ON_LUNAS=true, delete the piutang row (destructive)
                    if (String(process.env.PIUTANG_REMOVE_ON_LUNAS || '').toLowerCase() === 'true') {
                      try { await p.destroy({ transaction }); } catch (e) { console.error('failed to destroy piutang', e && e.message ? e.message : e); }
                    } else if (String(process.env.PIUTANG_ZERO_ON_LUNAS || '').toLowerCase() === 'true') {
                      // If PIUTANG_ZERO_ON_LUNAS=true, set jumlah_piutang and paid to 0 so it doesn't show as outstanding
                      try { await p.update({ jumlah_piutang: 0, paid: 0, updated_at: new Date() }, { transaction }); } catch (e) { console.error('failed to zero piutang amount', e && e.message ? e.message : e); }
                    }
                  }
                } catch (e) {
                  // swallow to avoid breaking payment flows
                }
              }
            remainingFunds = Math.max(0, remainingFunds - allocation);
            if (remainingFunds <= 0) break;
          }
        }
      }
    }
    // return summary so callers can decide whether to send invoice webhook
    const finalOrder = reloadedOrder || order;
    const sisaBayar = Number((Number(finalOrder.total_bayar || 0) - Number(totalPaid || 0)).toFixed(2));
    return {
      id_order: finalOrder.id_order,
      no_transaksi: finalOrder.no_transaksi,
      status: finalOrder.status,
      status_order: finalOrder.status_order,
      status_bot: finalOrder.status_bot,
      isFullyPaid: paymentStatus === 'lunas',
      totalPaid: Number(totalPaid || 0),
      sisa_bayar: sisaBayar
    };
  } catch (err) {
    // don't throw to avoid breaking payment flows; log to console for now
    console.error('syncPaymentEffects error:', err.message || err);
    return null;
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

    // Ensure there is a piutang row per order (so id_order is populated)
    // This handles legacy/aggregate piutang rows that had id_order=null by
    // creating per-order rows when missing.
    if (totalOutstanding > 0) {
      const now = new Date();
      for (const order of orders) {
        const paidForOrder = await models.Payment.sum('nominal', { where: { no_transaksi: order.no_transaksi }, transaction }) || 0;
        const remaining = Number(order.total_bayar || 0) - Number(paidForOrder || 0);
        if (remaining > 0) {
          // create per-order piutang only if not exists
          const existForOrder = await models.Piutang.findOne({ where: { id_order: order.id_order }, transaction });
          if (!existForOrder) {
            await models.Piutang.create({
              id_order: order.id_order,
              id_customer: customerId,
              jumlah_piutang: remaining,
              paid: 0.00,
              tanggal_piutang: now,
              status: 'belum_lunas',
              created_at: now,
              updated_at: now
            }, { transaction });
          }
        }
      }

      // Remove legacy aggregate piutang rows that don't reference an order (id_order IS NULL)
      // after per-order rows are ensured. Do this carefully within the provided transaction.
      try {
        await models.Piutang.destroy({ where: { id_customer: customerId, id_order: null }, transaction });
      } catch (e) {
        // If destroy fails for any reason, log and continue - not fatal for payment flows
        console.error('ensurePiutangForCustomer: failed to remove legacy piutang rows', e && e.message ? e.message : e);
      }
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
            const effects = await syncPaymentEffects(payment, null, { skipOrderWebhook: true, skipOrderStatusUpdate: true, usePaymentAmount: true });
            try { await setPaymentTypeIfFullyPaid(payment, effects, null); } catch(e) {}
            // send invoice webhook ONLY when the payment is verified
          try {
            if (payment && String(payment.status).toLowerCase() === 'verified') {
          const _txn = payment.no_transaksi || (effects && effects.no_transaksi);
            if (!shouldSkipInvoiceSend(_txn)) sendInvoiceWebhookOnce(req.app, _txn).catch(()=>{});
            }
          } catch (e) {}
            // emit payment created/updated
            try { emitPaymentEvent(req.app, payment, 'payment.created'); } catch (e) { /* ignore */ }
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
  const effects = await syncPaymentEffects(payment, null, { skipOrderWebhook: true, skipOrderStatusUpdate: true, usePaymentAmount: true });
  try { await setPaymentTypeIfFullyPaid(payment, effects, null); } catch(e) {}
  try {
    if (payment && String(payment.status).toLowerCase() === 'verified') {
      const _txn = payment.no_transaksi || (effects && effects.no_transaksi);
  if (!shouldSkipInvoiceSend(_txn)) sendInvoiceWebhookOnce(req.app, _txn).catch(()=>{});
    }
  } catch(e) {}
  try { emitPaymentEvent(req.app, payment, 'payment.created'); } catch (e) { }
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
  const effects = await syncPaymentEffects(payment, null, { skipOrderWebhook: true, skipOrderStatusUpdate: true, usePaymentAmount: true });
  try { await setPaymentTypeIfFullyPaid(payment, effects, null); } catch(e) {}
  try {
    if (payment && String(payment.status).toLowerCase() === 'verified') {
      const _txn = payment.no_transaksi || (effects && effects.no_transaksi);
  if (!shouldSkipInvoiceSend(_txn)) sendInvoiceWebhookOnce(req.app, _txn).catch(()=>{});
    }
  } catch(e) {}
  try { emitPaymentEvent(req.app, payment, 'payment.created'); } catch (e) { }
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
  const sisaBayar = Number((Number(order.total_bayar || 0) - Number(totalPaid || 0)).toFixed(2));
  res.status(200).json({ id_order: order.id_order, no_transaksi: order.no_transaksi, total_bayar: order.total_bayar, total_paid: Number(totalPaid || 0), sisa_bayar: sisaBayar, status_bayar: order.status_bayar });
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
  const effects = await syncPaymentEffects(updatedPayment, null, { skipOrderWebhook: true, skipOrderStatusUpdate: true, usePaymentAmount: true });
  try { await setPaymentTypeIfFullyPaid(updatedPayment, effects, null); } catch(e) {}
    try { if (updatedPayment && String(updatedPayment.status).toLowerCase() === 'verified') { sendInvoiceWebhookOnce(req.app, effects.no_transaksi).catch(()=>{}); } } catch(e) {}
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
  const effects = await syncPaymentEffects(payment, null, { skipOrderWebhook: true, skipOrderStatusUpdate: true, usePaymentAmount: true });
  try { await setPaymentTypeIfFullyPaid(payment, effects, null); } catch(e) {}
    try { if (payment && String(payment.status).toLowerCase() === 'verified') { sendInvoiceWebhookOnce(req.app, effects.no_transaksi).catch(()=>{}); } } catch(e) {}
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
  const effects = await syncPaymentEffects(updatedPayment, null, { skipOrderWebhook: true, skipOrderStatusUpdate: true, usePaymentAmount: true });
  try { await setPaymentTypeIfFullyPaid(updatedPayment, effects, null); } catch(e) {}
    try { if (updatedPayment && String(updatedPayment.status).toLowerCase() === 'verified') { sendInvoiceWebhookOnce(req.app, effects.no_transaksi).catch(()=>{}); } } catch(e) {}
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
  const effects = await syncPaymentEffects(updatedPayment, null, { skipOrderWebhook: true, skipOrderStatusUpdate: true, usePaymentAmount: true });
  try { await setPaymentTypeIfFullyPaid(updatedPayment, effects, null); } catch(e) {}
    try { if (updatedPayment && String(updatedPayment.status).toLowerCase() === 'verified') { sendInvoiceWebhookOnce(req.app, effects.no_transaksi).catch(()=>{}); } } catch(e) {}
    try { emitPaymentEvent(req.app, updatedPayment, 'payment.updated'); } catch (e) { }
      // trigger invoice webhook notify when payment is verified
      try { sendInvoiceWebhookOnce(req.app, updatedPayment.no_transaksi || (updatedPayment.Order && updatedPayment.Order.no_transaksi)).catch(e => { console.error('sendInvoiceWebhook error', e && e.message ? e.message : e); }); } catch (e) { console.error('sendInvoiceWebhook error', e && e.message ? e.message : e); }
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
  const effectsArr = await Promise.all(updatedPayments.map(p => syncPaymentEffects(p, null, { skipOrderWebhook: true, skipOrderStatusUpdate: true, usePaymentAmount: true })));
  try { await Promise.all(updatedPayments.map((p, i) => setPaymentTypeIfFullyPaid(p, effectsArr[i], null))); } catch(e) {}
    try { effectsArr.forEach(e => { if (e && String(e.status).toLowerCase() === 'verified') { try { sendInvoiceWebhookOnce(req.app, e.no_transaksi).catch(()=>{}); } catch(e) {} } }); } catch(e) {}
  try { updatedPayments.forEach(p => emitPaymentEvent(req.app, p, 'payment.updated')); } catch (e) { }
  // trigger invoice webhook for any updated payments that are verified
  try { updatedPayments.forEach(p => { if (p.status && String(p.status).toLowerCase() === 'verified') { try { sendInvoiceWebhookOnce(req.app, p.no_transaksi || (p.Order && p.Order.no_transaksi)).catch(()=>{}); } catch (e) {} } }); } catch (e) {}
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
      // Run updates in a DB transaction to ensure atomic updates to Payment, Order and Piutang
      const sequelize = models.sequelize || (models.sequelize && models.sequelize.constructor ? models.sequelize : null);
      const t = await models.sequelize.transaction();
      try {
        const payment = await models.Payment.findByPk(id, { transaction: t, lock: t.LOCK ? t.LOCK.UPDATE : undefined });
        if (!payment) {
          await t.rollback();
          return res.status(404).json({ error: 'Payment not found' });
        }
        // update nominal and status to verified within transaction
        await payment.update({ nominal, status: 'verified', updated_at: new Date() }, { transaction: t });

        // reload payment with relations inside transaction
        const updatedPayment = await models.Payment.findByPk(payment.id_payment, {
          include: [
            { model: models.Order, attributes: ['id_order', 'no_transaksi', 'id_customer'] },
            { model: models.Customer, attributes: ['id_customer', 'nama', 'no_hp'] }
          ],
          transaction: t
        });

        // ensure piutang exists and sync effects (both inside the same transaction)
        await ensurePiutangForCustomer(updatedPayment.id_customer || (updatedPayment.Order && updatedPayment.Order.id_customer), t);
  const effects = await syncPaymentEffects(updatedPayment, t, { skipOrderWebhook: true, skipOrderStatusUpdate: true, usePaymentAmount: true });

        // If this payment caused the order to become fully paid, normalize the payment type to 'pelunasan'
        try {
          if (effects && effects.isFullyPaid && updatedPayment.tipe && String(updatedPayment.tipe).toLowerCase() === 'dp') {
            await updatedPayment.update({ tipe: 'pelunasan', updated_at: new Date() }, { transaction: t });
          }
        } catch (e) {
          // ignore type update errors - not critical
        }

        // commit transaction before emitting events / sending webhooks
        await t.commit();

        // Emit events and send invoice webhook (non-transactional, after commit)
        try { if (updatedPayment && String(updatedPayment.status).toLowerCase() === 'verified') { sendInvoiceWebhookOnce(req.app, updatedPayment.no_transaksi || (effects && effects.no_transaksi)).catch(()=>{}); } } catch(e) {}
        try { emitPaymentEvent(req.app, updatedPayment, 'payment.updated'); } catch (e) { }

        // non-blocking notification call
        try {
          sendInvoiceWebhookOnce(req.app, updatedPayment.no_transaksi || (updatedPayment.Order && updatedPayment.Order.no_transaksi)).catch(err => {
            console.error('sendInvoiceWebhook (approve) error', err && err.message ? err.message : err);
          });
        } catch (e) {
          console.error('sendInvoiceWebhook(approve) sync error', e && e.message ? e.message : e);
        }

        res.status(200).json(updatedPayment);
      } catch (err) {
        try { await t.rollback(); } catch (e) {}
        throw err;
      }
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
  const effectsArr = await Promise.all(updatedPayments.map(p => syncPaymentEffects(p, null, { skipOrderWebhook: true, skipOrderStatusUpdate: true })));
  try { await Promise.all(updatedPayments.map((p, i) => setPaymentTypeIfFullyPaid(p, effectsArr[i], null))); } catch(e) {}
  // trigger invoice webhook ONLY for payments that are verified
  try { updatedPayments.forEach(p => { if (p && String(p.status).toLowerCase() === 'verified') { try { sendInvoiceWebhookOnce(req.app, p.no_transaksi || (p.Order && p.Order.no_transaksi)).catch(()=>{}); } catch (e) {} } }); } catch (e) {}
  res.status(200).json(updatedPayments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
,
  // Get payment allocations by payment id
  getAllocationsByPayment: async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) return res.status(400).json({ error: 'id payment required' });
      const allocs = await models.PaymentAllocation.findAll({ where: { id_payment: id }, order: [['tanggal_alloc','DESC']] });
      res.status(200).json(allocs);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
  // Get payment allocations by piutang id
  getAllocationsByPiutang: async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) return res.status(400).json({ error: 'id piutang required' });
      const allocs = await models.PaymentAllocation.findAll({ where: { id_piutang: id }, order: [['tanggal_alloc','DESC']] });
      res.status(200).json(allocs);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
};

// test-only export
try {
  module.exports.__test_syncPaymentEffects = syncPaymentEffects;
} catch (e) {}

// also expose helpers for scripts/tests
module.exports.syncPaymentEffects = syncPaymentEffects;
module.exports.ensurePiutangForCustomer = ensurePiutangForCustomer;
