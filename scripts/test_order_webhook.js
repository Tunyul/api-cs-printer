const { sendOrderCompletedWebhook } = require('../src/utils/orderWebhook');

// Allow passing phone, customerName, noTransaksi, invoiceUrl as CLI args for flexible testing:
//   node -r dotenv/config scripts/test_order_webhook.js <phone> "Customer Name" <no_transaksi> <invoice_url>
const phoneArg = process.argv[2] || '6288806301215';
const customerNameArg = process.argv[3] || 'Test Customer';
const noTransaksiArg = process.argv[4] || 'TRX-TEST';
const getAppUrl = require('../src/utils/getAppUrl');
const invoiceUrlArg = process.argv[5] || `${getAppUrl()}/invoice/TRX-TEST`;

(async () => {
  try {
    const ok = await sendOrderCompletedWebhook(phoneArg, customerNameArg, noTransaksiArg, invoiceUrlArg);
    console.log('sendOrderCompletedWebhook returned:', ok);
  } catch (e) {
    console.error('error running test', e);
  }
})();
