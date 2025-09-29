const axios = require('axios');
const fs = require('fs');

// phone: recipient phone number
// customerName: customer's display name (string)
// noTransaksi: transaction number (string)
// invoiceUrl: URL to the invoice PDF (string) - if not provided, function will construct a default using APP_URL
async function sendOrderCompletedWebhook(phone, customerName, noTransaksi, invoiceUrl) {
  try {
    if (!phone) return false;
    const webhookUrl = process.env.ORDER_STATUS_WEBHOOK_URL || process.env.INVOICE_WEBHOOK_URL;
    if (!webhookUrl) return false;

    const authUser = process.env.ORDER_WEBHOOK_USER || process.env.INVOICE_WEBHOOK_USER || '';
    const authPass = process.env.ORDER_WEBHOOK_PASS || process.env.INVOICE_WEBHOOK_PASS || '';
    const authHeader = (authUser || authPass) ? { auth: { username: authUser, password: authPass } } : {};

  const getAppUrl = require('./getAppUrl');
  const invoice_url = invoiceUrl || `${getAppUrl()}/invoice/${noTransaksi}.pdf`;

  // Build improved, user-friendly message with helpful next steps
  // Example:
  // "Cici, pesanan Anda (No: TRX-123) telah selesai. Terima kasih telah berbelanja!
  //  Total pembayaran sudah diterima. Jika ada pertanyaan, balas pesan ini atau hubungi CS di 0812-xxxx.
  //  Invoice: <link>"
  const lines = [];
  if (customerName) lines.push(`${customerName}, pesanan Anda telah selesai.`);
  else lines.push('Pesanan Anda telah selesai.');
  if (noTransaksi) lines.push(`No: ${noTransaksi}`);
  lines.push('Terima kasih telah berbelanja di toko kami. Total pembayaran telah diterima.');
  lines.push(`Invoice: ${invoice_url}`);
  lines.push('Butuh bantuan? Balas pesan ini atau hubungi CS.');
  const message = lines.join('\n');

    const payload = {
      phone: String(phone),
      name: customerName || '',
      no_transaksi: noTransaksi || '',
      invoice_url: String(invoice_url),
      message: message
    };

    // log payload for debugging
    try { fs.appendFileSync('server.log', `[${new Date().toISOString()}] order-webhook-payload ` + JSON.stringify(payload) + "\n"); } catch (e) {}

    const res = await axios.post(webhookUrl, payload, { timeout: 5000, ...authHeader });
    try { fs.appendFileSync('server.log', `[${new Date().toISOString()}] order-webhook status=${res.status}\n`); } catch (e) {}
    return true;
  } catch (err) {
    try { fs.appendFileSync('server.log', `[${new Date().toISOString()}] order-webhook error=${err && err.message ? err.message : err}\n`); } catch (e) {}
    return false;
  }
}

module.exports = { sendOrderCompletedWebhook };
