"use strict";

const path = require('path');
const ejs = require('ejs');
const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const getAppUrl = require('../utils/getAppUrl');

const cache = new Map(); // key -> { buffer, expires }
const DEFAULT_TTL = Number(process.env.PDF_CACHE_TTL || 86400) * 1000;

async function generatePdfBuffer({ order, orderDetails, customer, payments }) {
  // Render EJS template to HTML
  const templatePath = path.join(__dirname, '..', 'views', 'invoice.ejs');
  const html = await ejs.renderFile(templatePath, { order, orderDetails, customer, payments }, { async: true });

  // Launch puppeteer and render HTML to PDF
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' } });
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

async function fetchAggregateData(app, no_transaksi) {
  const models = app.get('models');
  const order = await models.Order.findOne({
    where: { no_transaksi },
    include: [{ model: models.OrderDetail, include: [models.Product] }, models.Customer]
  });

  if (!order) return null;

  const payments = await models.Payment.findAll({ where: { no_transaksi } });
  const customer = order.Customer || await models.Customer.findOne({ where: { id_customer: order.id_customer } });

  const orderDetails = order.OrderDetails || [];

  return { order, orderDetails, payments, customer };
}

async function getInvoicePdf(req, res) {
  try {
    const no = req.params.no_transaksi;
    if (!no) return res.status(400).json({ error: 'no_transaksi required' });

    // Cache key
    const key = `pdf:${no}`;
    const cached = cache.get(key);
    if (cached && cached.expires > Date.now()) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="invoice-${no}.pdf"`);
      res.setHeader('Cache-Control', `public, max-age=${Math.floor(DEFAULT_TTL/1000)}`);
      return res.send(cached.buffer);
    }

    const data = await fetchAggregateData(req.app, no);
    if (!data) {
      // Return 404 with JSON or HTML depending on Accept
      if (req.accepts('html')) return res.status(404).send('<h1>Invoice not found</h1>');
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const buffer = await generatePdfBuffer(data);

    // store in cache
    cache.set(key, { buffer, expires: Date.now() + DEFAULT_TTL });

  res.setHeader('Content-Type', 'application/pdf');
  // allow forcing download via ?download=1 (useful when clients/Chrome block inline preview)
  const forceDownload = req && req.query && (req.query.download === '1' || String(req.query.download).toLowerCase() === 'true');
  res.setHeader('Content-Disposition', `${forceDownload ? 'attachment' : 'inline'}; filename="invoice-${no}.pdf"`);
    res.setHeader('Cache-Control', `public, max-age=${Math.floor(DEFAULT_TTL/1000)}`);
    return res.send(buffer);
  } catch (err) {
    console.error('Error generating invoice PDF', err);
    return res.status(500).json({ error: err.message });
  }
}

async function postNotifyWebhook(req, res) {
  try {
    const no = req.params.no_transaksi;
    if (!no) return res.status(400).json({ error: 'no_transaksi required' });

    const data = await fetchAggregateData(req.app, no);
    if (!data) return res.status(404).json({ error: 'Order not found' });

    const customerPhone = data.customer?.no_hp || '';
    const payload = {
      transaksi: data.order.no_transaksi,
      invoice_url: `${getAppUrl()}/invoice/${data.order.no_transaksi}.pdf`,
      customer: { nama: data.customer?.nama || '', phone: String(customerPhone || ''), no_hp: String(customerPhone || '') },
      total: Number(data.order.total_bayar || data.order.total_harga || 0),
      paid: data.payments.reduce((s, p) => s + Number(p.nominal || 0), 0),
      balance: Number(data.order.total_bayar || data.order.total_harga || 0) - data.payments.reduce((s, p) => s + Number(p.nominal || 0), 0),
      payments: data.payments.map(p => ({ id: p.id_payment || p.id, tanggal: p.tanggal, nominal: Number(p.nominal) })),
      items: data.orderDetails.map(d => ({ nama: d.Product ? d.Product.nama_produk : 'Item', qty: d.quantity, unit_price: Number(d.harga_satuan) }))
    };

    const webhookUrl = process.env.INVOICE_WEBHOOK_URL;
    if (!webhookUrl) return res.status(500).json({ error: 'Webhook not configured' });

  // Read credentials from env with safe fallbacks
  const authUser = process.env.INVOICE_WEBHOOK_USER || 'inin';
  const authPass = process.env.INVOICE_WEBHOOK_PASS || '1234';

  const authHeader = { auth: { username: authUser, password: authPass } };

    // Attempt with retries on transient errors
    const maxRetries = 3;
    let attempt = 0;
    let lastError = null;
    let result = null;
    while (attempt < maxRetries) {
      try {
        attempt++;
        result = await axios.post(webhookUrl, payload, { timeout: 5000, ...authHeader });
        // log
        const logLine = `[${new Date().toISOString()}] notify ${no} attempt=${attempt} status=${result.status}\n`;
        fs.appendFileSync('server.log', logLine);
        break;
      } catch (err) {
        lastError = err;
        const logLine = `[${new Date().toISOString()}] notify ${no} attempt=${attempt} error=${err.message}\n`;
        fs.appendFileSync('server.log', logLine);
        // retry on 5xx or network errors
        if (err.response && err.response.status >= 400 && err.response.status < 500) break; // do not retry client errors
        await new Promise(r => setTimeout(r, attempt * 500));
      }
    }

    if (!result) return res.status(502).json({ error: 'Failed to notify webhook', detail: lastError ? lastError.message : null });

    // Emit realtime event to customer if Socket.IO available
    try {
      const io = req.app.get('io');
      if (io && data.order) {
        const notifyPayload = {
          no_transaksi: data.order.no_transaksi,
          invoice_url: payload.invoice_url,
          status: 'sent',
          timestamp: new Date().toISOString()
        };
        // emit to admin only
        io.to('role:admin').emit('invoice.notify', notifyPayload);
      }
    } catch (e) {
      // non-fatal - just log
      console.error('Error emitting realtime notify', e);
    }

    return res.status(200).json({ success: true, status: result.status, data: result.data });
  } catch (err) {
    console.error('Error in notify webhook', err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { getInvoicePdf, postNotifyWebhook };

// Simple HTML landing page for invoices to make links previewable/clickable
// Example: GET /invoice/TRX-12345 -> serves an HTML page with Open Graph meta tags
async function getInvoiceLanding(req, res) {
  try {
    const no = req.params.no_transaksi;
    if (!no) return res.status(400).send('no_transaksi required');

    const data = await fetchAggregateData(req.app, no);
    if (!data) return res.status(404).send('<h1>Invoice not found</h1>');

    const appUrl = getAppUrl();
    const pdfUrl = `${appUrl}/invoice/${no}.pdf`;
    const title = `Invoice ${no} - ${data.customer ? data.customer.nama : ''}`;
    const description = `Total: ${Number(data.order.total_bayar || data.order.total_harga || 0).toLocaleString()} - Klik untuk lihat invoice dan detail pesanan.`;

    // Minimal HTML with Open Graph tags; WhatsApp will use these for preview
    const html = `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(appUrl + req.originalUrl)}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <style>body{font-family:Arial,helvetica,sans-serif;margin:24px;} .card{max-width:680px;border:1px solid #eee;padding:18px;border-radius:8px;} a.button{display:inline-block;margin-top:12px;padding:10px 14px;background:#2d8cff;color:#fff;border-radius:6px;text-decoration:none;} </style>
</head>
<body>
  <div class="card">
    <h2>${escapeHtml(title)}</h2>
    <p>${escapeHtml(description)}</p>
    <p><strong>Nama:</strong> ${escapeHtml(data.customer ? data.customer.nama : '')}</p>
    <p><strong>No transaksi:</strong> ${escapeHtml(no)}</p>
    <a class="button" href="${escapeHtml(pdfUrl)}" target="_blank" rel="noopener">Lihat/Download Invoice (PDF)</a>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (err) {
    console.error('getInvoiceLanding error', err);
    return res.status(500).send('Internal server error');
  }
}

// small helper to escape HTML entities
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, function (s) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[s];
  });
}

// Export landing handler alongside existing exports
module.exports = { getInvoicePdf, postNotifyWebhook, getInvoiceLanding };

// Helper to clear cached PDF buffer for a transaction (used when invoices change)
function clearInvoicePdfCache(no_transaksi) {
  try {
    if (!no_transaksi) return false;
    const key = `pdf:${no_transaksi}`;
    if (cache.has(key)) {
      cache.delete(key);
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

module.exports.clearInvoicePdfCache = clearInvoicePdfCache;
