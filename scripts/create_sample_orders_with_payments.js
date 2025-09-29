#!/usr/bin/env node
require('dotenv').config();

const { v4: uuidv4 } = require('uuid');
const models = require('../src/models');

function now() { return new Date(); }

async function findOrCreateCustomer(nama, no_hp) {
  let cust = await models.Customer.findOne({ where: { no_hp } });
  if (!cust) {
    cust = await models.Customer.create({ nama, no_hp, tipe_customer: 'reguler', batas_piutang: null, catatan: '', created_at: now(), updated_at: now() });
    console.log('Created customer', cust.nama, cust.no_hp);
  } else {
    console.log('Found customer', cust.nama, cust.no_hp);
  }
  return cust;
}

async function createOrderForCustomer(customer, total_bayar, noteSuffix) {
  const no_transaksi = `TRX-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*9000)+1000}-${String(customer.nama).toUpperCase().slice(0,4)}`;
  const order = await models.Order.create({ id_customer: customer.id_customer, no_transaksi, tanggal_order: now(), status_urgensi: 'normal', total_bayar, dp_bayar: 0, status_bayar: 'belum_lunas', tanggal_jatuh_tempo: new Date(Date.now()+7*24*3600*1000), link_invoice: '', link_drive: '', status_order: 'pending', total_harga: total_bayar, status: 'pending', catatan: `Sample ${noteSuffix}`, status_bot: 'pending', created_at: now(), updated_at: now() });
  // minimal order detail
  await models.OrderDetail.create({ id_order: order.id_order, id_produk: 1, quantity: 1, harga_satuan: total_bayar, subtotal_item: total_bayar, created_at: now(), updated_at: now() });
  return order;
}

async function createPayment(order, customer, nominal, tipe, status='verified') {
  const payment = await models.Payment.create({ id_order: order.id_order, id_customer: customer.id_customer, no_transaksi: order.no_transaksi, no_hp: customer.no_hp, nominal, bukti: `https://example.com/bukti/${uuidv4()}.jpg`, tipe, status, tanggal: now(), created_at: now(), updated_at: now() });
  return payment;
}

async function createPiutang(order, customer, amount, paid=0) {
  const p = await models.Piutang.create({ id_customer: customer.id_customer, jumlah_piutang: amount, paid, tanggal_piutang: now(), status: paid >= amount ? 'lunas' : 'belum_lunas', keterangan: `Piutang for ${order.no_transaksi}`, id_order: order.id_order, created_at: now(), updated_at: now() });
  return p;
}

async function main() {
  try {
    // Customers
    const c1 = await findOrCreateCustomer('Cici', '6288806301215');
    const c2 = await findOrCreateCustomer('Budi', '6287700000003');
    const c3 = await findOrCreateCustomer('Ayu', '6287700000004');

    // Order 1: Cici - total 600000, dp 250000 verified, remaining 350000 piutang
    const o1 = await createOrderForCustomer(c1, 600000, 'Cici sample order');
    const p1 = await createPayment(o1, c1, 250000, 'dp', 'verified');
    await createPiutang(o1, c1, 350000, 0);

    // Order 2: Budi - total 1200000, full payment verified
    const o2 = await createOrderForCustomer(c2, 1200000, 'Budi full paid');
    const p2 = await createPayment(o2, c2, 1200000, 'pelunasan', 'verified');

    // Order 3: Ayu - total 800000, partial dp 300000 verified, remaining 500000 piutang
    const o3 = await createOrderForCustomer(c3, 800000, 'Ayu partial');
    const p3 = await createPayment(o3, c3, 300000, 'dp', 'verified');
    await createPiutang(o3, c3, 500000, 0);

    console.log('\nCreated sample data:');
    const payments = await models.Payment.findAll({ where: { no_transaksi: [o1.no_transaksi, o2.no_transaksi, o3.no_transaksi] }, include: [models.Order, models.Customer] });
    console.log('Payments:', payments.map(p => ({ id: p.id_payment, no_transaksi: p.no_transaksi, nominal: Number(p.nominal), tipe: p.tipe, status: p.status })));
    const piutangs = await models.Piutang.findAll({ where: { id_customer: [c1.id_customer, c2.id_customer, c3.id_customer] } });
    console.log('Piutangs:', piutangs.map(p => ({ id: p.id_piutang, id_customer: p.id_customer, jumlah: Number(p.jumlah_piutang), paid: Number(p.paid), status: p.status, id_order: p.id_order })));

    process.exit(0);
  } catch (err) {
    console.error('Error creating sample data', err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();
