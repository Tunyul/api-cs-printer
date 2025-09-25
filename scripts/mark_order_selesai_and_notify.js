require('dotenv').config();

const models = require('../src/models');
const { sendOrderCompletedWebhook } = require('../src/utils/orderWebhook');
const fs = require('fs');

const NO_TRANSAKSI = process.argv[2] || 'TRX-24092025-8752-CICI';

(async () => {
  try {
    console.log('Looking for order', NO_TRANSAKSI);
    const order = await models.Order.findOne({ where: { no_transaksi: NO_TRANSAKSI }, include: [models.Customer] });
    if (!order) {
      console.error('Order not found for', NO_TRANSAKSI);
      process.exit(2);
    }

    console.log('Found order id_order=', order.id_order, 'current status=', order.status);
    // Update fields to mark selesai
    await order.update({ status: 'selesai', status_order: 'selesai', status_bot: 'selesai', status_bayar: 'lunas', dp_bayar: order.total_bayar, updated_at: new Date() });
    console.log('Order updated to selesai');

    const customer = order.Customer || (order.id_customer ? await models.Customer.findByPk(order.id_customer) : null);
    const phone = customer ? customer.no_hp : null;
    const name = customer ? customer.nama : '';
    const invoiceUrl = `${process.env.APP_URL || 'http://localhost:3000'}/invoice/${order.no_transaksi}.pdf`;

    console.log('Calling sendOrderCompletedWebhook to', phone);
    const ok = await sendOrderCompletedWebhook(phone, name, order.no_transaksi, invoiceUrl);
    console.log('sendOrderCompletedWebhook returned:', ok);

    // Show last few lines from server.log if available
    try {
      const log = fs.readFileSync('server.log', 'utf8');
      const lines = log.trim().split('\n');
      console.log('Last 10 server.log lines:');
      console.log(lines.slice(-10).join('\n'));
    } catch (e) {
      console.log('server.log not readable:', e.message);
    }

    process.exit(ok ? 0 : 1);
  } catch (err) {
    console.error('error', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
