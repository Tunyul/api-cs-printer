require('dotenv').config();
(async function(){
  try{
    const models = require('../src/models');
    const axios = require('axios');
    const fs = require('fs');
    const getAppUrl = require('../src/utils/getAppUrl');
    const no = process.argv[2];
    if(!no) return console.error('Usage: node scripts/resend_invoice.js <NO_TRANSAKSI>');
    const order = await models.Order.findOne({ where: { no_transaksi: no }, include: [models.Customer] });
    if(!order) return console.error('Order not found', no);
    const customer = order.Customer || await models.Customer.findByPk(order.id_customer);
    const payload = {
      phone: customer && customer.no_hp ? String(customer.no_hp) : '',
      invoice_url: `${getAppUrl()}/invoice/${order.no_transaksi}.pdf`
    };

    console.log('Resend payload:', payload);
    fs.appendFileSync('server.log', `[${new Date().toISOString()}] webhook-resend ${no} `+JSON.stringify(payload)+"\n");

    const webhookUrl = process.env.INVOICE_WEBHOOK_URL;
    if(!webhookUrl) return console.error('INVOICE_WEBHOOK_URL not configured');
    const auth = { auth: { username: process.env.INVOICE_WEBHOOK_USER || 'inin', password: process.env.INVOICE_WEBHOOK_PASS || '1234' } };
    try{
      const r = await axios.post(webhookUrl, payload, { timeout: 10000, ...auth });
      console.log('Posted. status=', r.status);
      console.log('Response data:', r.data);
      fs.appendFileSync('server.log', `[${new Date().toISOString()}] webhook-resend-result ${no} status=${r.status}\n`);
    }catch(e){
      console.error('Post error', e && e.message);
      fs.appendFileSync('server.log', `[${new Date().toISOString()}] webhook-resend-error ${no} error=${e && e.message}\n`);
    }
  }catch(err){
    console.error('Error', err && err.message);
    process.exit(1);
  }
})();
