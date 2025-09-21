/*
Seeder: seed_dummy_finance.js
Creates:
- 30 orders
- 40 payments
- 30 piutangs
It reuses existing customers.
Run: node scripts/seed_dummy_finance.js
*/

const path = require('path');
const db = require('../src/models');

async function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDecimal(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  console.log('Loading customers...');
  const customers = await db.Customer.findAll();
  if (!customers || customers.length === 0) {
    console.error('No customers found. Seed some customers first.');
    process.exit(1);
  }

  console.log(`Found ${customers.length} customers. Creating dummy data...`);

  const orders = [];
  const payments = [];
  const piutangs = [];

  // Create 30 orders
  for (let i = 0; i < 30; i++) {
    const cust = await randomPick(customers);
    const now = new Date();
    const tanggal_order = addDays(now, -randomInt(0, 30));
    const no_transaksi = `DUMMY-${Date.now()}-${i}`;
    const total_harga = parseFloat(randomDecimal(50000, 500000));
    const dp_bayar = parseFloat(randomDecimal(0, Math.min(200000, total_harga)));
    const total_bayar = total_harga;
    const status_bayar = dp_bayar > 0 ? 'dp' : 'belum_bayar';
    const tanggal_jatuh_tempo = addDays(tanggal_order, randomInt(7, 30));

    const order = await db.Order.create({
      no_transaksi,
      id_customer: cust.id_customer,
      tanggal_order,
      status_urgensi: 'normal',
      total_bayar,
      dp_bayar,
      status_bayar,
      tanggal_jatuh_tempo,
      status_order: 'new',
      total_harga,
      status: 'pending',
      created_at: tanggal_order,
      updated_at: tanggal_order,
    });

    orders.push(order);
  }

  // Create 40 payments, attach to random orders/customers
  for (let i = 0; i < 40; i++) {
    const order = await randomPick(orders);
    const customer = await db.Customer.findOne({ where: { id_customer: order.id_customer } });
    const nominal = parseFloat(randomDecimal(10000, Math.min(300000, parseFloat(order.total_bayar))));
    const tipe = Math.random() < 0.5 ? 'dp' : 'pelunasan';
    const status = 'confirmed';
    const tanggal = addDays(order.tanggal_order || new Date(), randomInt(0, 10));

    const payment = await db.Payment.create({
      no_transaksi: order.no_transaksi,
      no_hp: customer.no_hp,
      nominal,
      status,
      tanggal,
      bukti: null,
      tipe,
    });

    payments.push(payment);
  }

  // Create 30 piutangs linked to random customers and orders
  for (let i = 0; i < 30; i++) {
    const cust = await randomPick(customers);
    // optionally link to an order of that customer
    const customerOrders = orders.filter(o => o.id_customer === cust.id_customer);
    const linkedOrder = customerOrders.length > 0 ? randomPick(customerOrders) : null;

    const jumlah_piutang = parseFloat(randomDecimal(50000, 400000));
    const paid = parseFloat(randomDecimal(0, jumlah_piutang));
    const tanggal_piutang = addDays(new Date(), -randomInt(0, 60));
    const status = paid >= jumlah_piutang ? 'lunas' : 'belum_lunas';

    const piutang = await db.Piutang.create({
      id_customer: cust.id_customer,
      jumlah_piutang,
      paid,
      tanggal_piutang,
      status,
      keterangan: 'Dummy piutang',
      id_order: linkedOrder ? linkedOrder.id_order : null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    piutangs.push(piutang);
  }

  console.log(`Created ${orders.length} orders, ${payments.length} payments, ${piutangs.length} piutangs`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
