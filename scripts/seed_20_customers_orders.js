#!/usr/bin/env node
require('dotenv').config();
const models = require('../src/models');
const { v4: uuidv4 } = require('uuid');

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function now() { return new Date(); }

async function createCustomer(i) {
  const phone = `6287700000${String(1000 + i).slice(-4)}`;
  const name = `Cust${i}`;
  let c = await models.Customer.findOne({ where: { no_hp: phone } });
  if (!c) c = await models.Customer.create({ nama: name, no_hp: phone, tipe_customer: 'reguler', batas_piutang: null, catatan: '', created_at: now(), updated_at: now() });
  return c;
}

async function createOrder(cust, idx) {
  const makeTxn = () => `TRX-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Date.now()}-${Math.floor(Math.random()*90000)+1000}-${String(cust.nama).toUpperCase().slice(0,4)}`;
  let no_transaksi = makeTxn();
  const total = randInt(200000, 1500000);
  let order;
  try {
    order = await models.Order.create({ id_customer: cust.id_customer, no_transaksi, tanggal_order: now(), status_urgensi: 'normal', total_bayar: total, dp_bayar: 0, status_bayar: 'belum_lunas', tanggal_jatuh_tempo: new Date(Date.now()+7*24*3600*1000), link_invoice: '', link_drive: '', status_order: 'pending', total_harga: total, status: 'pending', catatan: '', status_bot: 'pending', created_at: now(), updated_at: now() });
  } catch (err) {
    // If unique constraint on no_transaksi, retry once with new txn
    if (err && err.errors && err.errors.some(e => e.message && e.message.toLowerCase().includes('unique') )) {
      no_transaksi = makeTxn();
      try {
        order = await models.Order.create({ id_customer: cust.id_customer, no_transaksi, tanggal_order: now(), status_urgensi: 'normal', total_bayar: total, dp_bayar: 0, status_bayar: 'belum_lunas', tanggal_jatuh_tempo: new Date(Date.now()+7*24*3600*1000), link_invoice: '', link_drive: '', status_order: 'pending', total_harga: total, status: 'pending', catatan: '', status_bot: 'pending', created_at: now(), updated_at: now() });
      } catch (err2) {
        console.error('Failed creating order for', cust.no_hp, 'payload', { id_customer: cust.id_customer, no_transaksi, total });
        if (err2 && err2.errors) console.error('Validation details:', err2.errors.map(e=>({message:e.message, path:e.path, value:e.value}))); else console.error(err2 && err2.message ? err2.message : err2);
        throw err2;
      }
    } else {
      console.error('Failed creating order for', cust.no_hp, 'payload', { id_customer: cust.id_customer, no_transaksi, total });
      if (err && err.errors) console.error('Validation details:', err.errors.map(e=>({message:e.message, path:e.path, value:e.value}))); else console.error(err && err.message ? err.message : err);
      throw err;
    }
  }
  await models.OrderDetail.create({ id_order: order.id_order, id_produk: 1, quantity: 1, harga_satuan: total, subtotal_item: total, created_at: now(), updated_at: now() });
  return order;
}

async function createPaymentAndPiutang(order, cust) {
  // Decide a payment scenario
  const scenario = randInt(1,3);
  if (scenario === 1) {
    // fully paid
    const p = await models.Payment.create({ id_order: order.id_order, id_customer: cust.id_customer, no_transaksi: order.no_transaksi, no_hp: cust.no_hp, nominal: order.total_bayar, bukti: `https://example.com/bukti/${uuidv4()}.jpg`, tipe: 'pelunasan', status: 'verified', tanggal: now(), created_at: now(), updated_at: now() });
    return { payment: p, piutang: null };
  } else if (scenario === 2) {
    // dp paid, remaining piutang
    const dp = Math.floor(order.total_bayar * 0.3);
    const p = await models.Payment.create({ id_order: order.id_order, id_customer: cust.id_customer, no_transaksi: order.no_transaksi, no_hp: cust.no_hp, nominal: dp, bukti: `https://example.com/bukti/${uuidv4()}.jpg`, tipe: 'dp', status: 'verified', tanggal: now(), created_at: now(), updated_at: now() });
    const remaining = order.total_bayar - dp;
    const pi = await models.Piutang.create({ id_customer: cust.id_customer, jumlah_piutang: remaining, paid: 0, tanggal_piutang: now(), status: 'belum_lunas', keterangan: `Piutang for ${order.no_transaksi}`, id_order: order.id_order, created_at: now(), updated_at: now() });
    return { payment: p, piutang: pi };
  } else {
    // no payment yet, full piutang
    const pi = await models.Piutang.create({ id_customer: cust.id_customer, jumlah_piutang: order.total_bayar, paid: 0, tanggal_piutang: now(), status: 'belum_lunas', keterangan: `Piutang for ${order.no_transaksi}`, id_order: order.id_order, created_at: now(), updated_at: now() });
    return { payment: null, piutang: pi };
  }
}

async function main() {
  try {
    const results = [];
    for (let i=1;i<=20;i++) {
      const cust = await createCustomer(i);
      const numOrders = randInt(2,3);
      for (let j=0;j<numOrders;j++) {
        console.log(`Creating order ${j+1}/${numOrders} for customer ${cust.no_hp}`);
        const order = await createOrder(cust, j);
        const r = await createPaymentAndPiutang(order, cust);
        results.push({ customer: cust.no_hp, order: order.no_transaksi, total: order.total_bayar, payment: r.payment ? Number(r.payment.nominal) : null, piutang: r.piutang ? Number(r.piutang.jumlah_piutang) : null });
      }
    }
    console.log('Seeded 20 customers with orders (summary):');
    console.log(results.slice(0,50));
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data', err && err.message ? err.message : err);
    if (err && err.stack) console.error(err.stack);
    process.exit(1);
  }
}

main();
