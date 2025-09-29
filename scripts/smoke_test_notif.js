#!/usr/bin/env node
/*
  Smoke test script for bot flow: create customer, create order, add order-detail, create payment
  Usage:
    BOT_API_KEY=yourkey BASE_URL=http://localhost:3000 node scripts/smoke_test_notif.js
  The script waits 3 seconds between each step.
*/

const fetch = require('node-fetch');

const BOT_API_KEY = process.env.BOT_API_KEY;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

if (!BOT_API_KEY) {
  console.error('Missing BOT_API_KEY environment variable');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'x-bot-key': BOT_API_KEY
};

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  try {
    console.log('Starting bot smoke test...');
    const data = {
      nama: 'testnotiftiga',
      no_hp: '623333333333'
    };

    // 1) create/check customer
    console.log('\n[1] Create/check customer');
    let res = await fetch(`${BASE_URL}/api/bot/customer`, { method: 'POST', headers, body: JSON.stringify(data) });
    let json = await res.json();
    console.log('status=', res.status, 'body=', json);

    await wait(3000);

    // 2) create/get pending order
    console.log('\n[2] Create/get pending order');
    res = await fetch(`${BASE_URL}/api/bot/order`, { method: 'POST', headers, body: JSON.stringify({ no_hp: data.no_hp }) });
    json = await res.json();
    console.log('status=', res.status, 'body=', json);
    const no_transaksi = json.no_transaksi || (json.order && json.order.no_transaksi);
    if (!no_transaksi) {
      console.error('no_transaksi not found, aborting');
      process.exit(1);
    }

    await wait(3000);

    // 3) add order detail
    console.log('\n[3] Add order detail (product 1, qty 100)');
    const odPayload = { no_transaksi, order_details: [{ id_product: 1, qty: 100 }] };
    res = await fetch(`${BASE_URL}/api/bot/order-detail`, { method: 'POST', headers, body: JSON.stringify(odPayload) });
    json = await res.json();
    console.log('status=', res.status, 'body=', json);

    await wait(3000);

    // 4) submit payment with bukti link
    console.log('\n[4] Submit payment (bukti link)');
    const paymentPayload = {
      no_transaksi,
      link_bukti: 'https://media.karousell.com/media/photos/products/2019/02/03/bukti_transfer_dari_customer_1549170174_29ee2dd4_progressive.jpg',
      no_hp: data.no_hp
    };
    res = await fetch(`${BASE_URL}/api/bot/payment`, { method: 'POST', headers, body: JSON.stringify(paymentPayload) });
    json = await res.json();
    console.log('status=', res.status, 'body=', json);

    console.log('\nSmoke test completed. Check server logs and notifications.');
  } catch (err) {
    console.error('Error during smoke test:', err);
    process.exit(1);
  }
}

run();
