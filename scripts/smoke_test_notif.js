const axios = require('axios');

// Config
const BOT_KEY = process.env.BOT_KEY || 'supersemar1998';
const BASE = process.env.BASE_URL || 'http://localhost:3000';

const headers = { 'x-bot-key': BOT_KEY, 'Content-Type': 'application/json' };

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  try {
    console.log('Starting smoke test (3s delay between steps)');

    // Step 1: create customer
    const customerPayload = { no_hp: '6281122334456', nama: 'testnotifsatu' };
    console.log('1) Creating customer', customerPayload);
    const cResp = await axios.post(`${BASE}/api/bot/customer`, customerPayload, { headers });
    console.log('1) Response status:', cResp.status);
    console.log('1) Body:', cResp.data);

    await sleep(3000);

    // Step 2: create order (bot)
    const orderPayload = { no_hp: '6281122334456' };
    console.log('2) Creating order for customer', orderPayload);
    const oResp = await axios.post(`${BASE}/api/bot/order`, orderPayload, { headers });
    console.log('2) Response status:', oResp.status);
    console.log('2) Body:', oResp.data);

    await sleep(3000);

    // Step 3: create payment (bot)
    // The bot payment endpoint expects no_transaksi, link_bukti, no_hp
    const no_transaksi = (oResp.data && (oResp.data.no_transaksi || oResp.data.no_transaksi)) || null;
    if (!no_transaksi) {
      console.error('No no_transaksi found in order response; aborting payment step');
      process.exit(2);
    }
    const paymentPayload = { no_transaksi, link_bukti: 'okokoko.com', no_hp: '6281122334456' };
    console.log('3) Creating payment', paymentPayload);
    const pResp = await axios.post(`${BASE}/api/bot/payment`, paymentPayload, { headers });
    console.log('3) Response status:', pResp.status);
    console.log('3) Body:', pResp.data);

    console.log('Smoke test completed. Check admin notifications for events.');
  } catch (err) {
    if (err.response) {
      console.error('Error response status:', err.response.status);
      console.error('Error response data:', err.response.data);
    } else {
      console.error('Error:', err.message);
    }
    process.exit(1);
  }
}

if (require.main === module) run();
