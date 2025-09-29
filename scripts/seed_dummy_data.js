// scripts/seed_dummy_data.js
// Run with: node scripts/seed_dummy_data.js

const models = require('../src/models');
const { Op } = require('sequelize');

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const firstNames = ['Agus','Budi','Citra','Dewi','Eka','Farid','Gita','Hadi','Intan','Joko','Kiki','Lina','Mega','Nina','Oki','Putri','Rudi','Sari','Tono','Uli','Vina','Wati','Xena','Yanto','Zaki'];
const lastNames = ['Santoso','Wijaya','Putra','Pratama','Sutanto','Hidayat','Saputra','Kurniawan','Ramadhani','Nugroho','Mahendra','Susanto','Hartono','Prasetyo','Wahyudi'];

function randomName() {
  const f = firstNames[randInt(0, firstNames.length-1)];
  const l = lastNames[randInt(0, lastNames.length-1)];
  return `${f} ${l}`;
}

function randomPhone(i) {
  // generate unique Indonesian mobile numbers starting with 62888 / 62811 etc
  const prefixes = ['62811','62812','62813','62821','62822','62823','62888','62881'];
  const p = prefixes[i % prefixes.length];
  const rest = String(10000000 + Math.floor(Math.random()*89999999)).slice(0,8);
  return p + rest;
}

async function ensureProducts() {
  // Ensure DB has expected columns (unit_area may be missing on older schemas)
  try {
    const [results] = await models.sequelize.query("SHOW COLUMNS FROM products LIKE 'unit_area'");
    if (!results || results.length === 0) {
      console.log('Adding missing column unit_area to products table');
      await models.sequelize.query("ALTER TABLE products ADD COLUMN unit_area DECIMAL(10,2) NULL");
    }
  } catch (e) {
    console.warn('Could not ensure unit_area column:', e.message || e);
  }

  const products = await models.Product.findAll({ limit: 20 });
  if (products.length >= 20) return products;
  const created = [];
  for (let i=0;i<20;i++) {
    const nama = `Produk ${i+1}`;
    const harga = randInt(10000, 200000);
    const p = await models.Product.create({ kategori: 'Cetak', nama_produk: nama, bahan: 'Karton', finishing: 'Gloss', ukuran_standar: 'pcs', harga_per_pcs: harga, unit_area: null, waktu_proses: '2 hari', created_at: new Date(), updated_at: new Date(), stock: randInt(0,100) });
    created.push(p);
  }
  return created;
}

function generateTransactionNumber(name) {
  const date = new Date();
  const day = String(date.getDate()).padStart(2,'0');
  const month = String(date.getMonth()+1).padStart(2,'0');
  const year = date.getFullYear();
  const random = Math.floor(Math.random()*9000)+1000;
  const namePart = (name || 'CUST').split(' ')[0].toUpperCase().slice(0,6);
  return `TRX-${day}${month}${year}-${random}-${namePart}`;
}

async function main() {
  try {
    await models.sequelize.authenticate();
    console.log('DB connected');

    const products = await ensureProducts();
    console.log('Products ready:', products.length);

    // Create 30 customers
    const customers = [];
    for (let i=0;i<30;i++) {
      const nama = randomName();
      const no_hp = randomPhone(i*3 + i);
    // tipe_customer must be one of ('reguler','vip','hutang') per model
    const cust = await models.Customer.create({ nama, no_hp, tipe_customer: 'reguler', batas_piutang: null, catatan: '', created_at: new Date(), updated_at: new Date() });
      customers.push(cust);
    }
    console.log('Customers created:', customers.length);

    // Create 40-50 orders
    const orders = [];
    const orderCount = randInt(40,50);
    const statusChoices = ['pending','proses','selesai','batal'];
    for (let i=0;i<orderCount;i++) {
      const customer = customers[randInt(0, customers.length-1)];
      const no_transaksi = generateTransactionNumber(customer.nama);
      const tanggal_order = new Date(Date.now() - randInt(0, 20) * 24*3600*1000);
      const status = statusChoices[randInt(0, statusChoices.length-1)];
      const status_bot = Math.random() < 0.5 ? 'pending' : 'selesai';

      const order = await models.Order.create({ id_customer: customer.id_customer, no_transaksi, tanggal_order, status_urgensi: 'normal', total_bayar: 0, dp_bayar: 0, status_bayar: 'belum_lunas', tanggal_jatuh_tempo: new Date(Date.now()+7*24*3600*1000), link_invoice: '', link_drive: '', status_order: 'pending', total_harga: 0, status, catatan: '', status_bot, created_at: new Date(), updated_at: new Date() });

      // create 3-5 order details
      const detailCount = randInt(3,5);
      let totalHarga = 0;
      for (let d=0; d<detailCount; d++) {
        const product = products[randInt(0, products.length-1)];
        const qty = randInt(1,5);
        const harga_satuan = Number(product.harga_per_pcs || 0);
        const subtotal_item = harga_satuan * qty;
        await models.OrderDetail.create({ id_order: order.id_order, id_produk: product.id_produk, quantity: qty, harga_satuan, subtotal_item, created_at: new Date(), updated_at: new Date() });
        totalHarga += subtotal_item;
      }
      await order.update({ total_bayar: totalHarga, total_harga: totalHarga });
      orders.push(order);
    }
    console.log('Orders created:', orders.length);

    // Create 50-60 payments
    const payments = [];
    const paymentCount = randInt(50,60);
    for (let i=0;i<paymentCount;i++) {
      // pick random order
      const order = orders[randInt(0, orders.length-1)];
      const customer = customers.find(c => c.id_customer === order.id_customer);
      const phone = customer ? customer.no_hp : null;
      // choose nominal: sometimes partial, sometimes full
      const orderTotal = Number(order.total_bayar || 0);
      let nominal = 0;
      if (Math.random() < 0.3) {
        // small DP
        nominal = Math.round(orderTotal * (Math.random() * 0.3));
      } else if (Math.random() < 0.6) {
        // half or more
        nominal = Math.round(orderTotal * (0.3 + Math.random()*0.6));
      } else {
        // full
        nominal = orderTotal;
      }
      if (nominal <= 0) nominal = randInt(10000, 50000);
      const status = Math.random() < 0.6 ? 'menunggu_verifikasi' : (Math.random() < 0.5 ? 'verified' : 'pending');
      const bukti = `https://example.com/bukti/${Math.random().toString(36).slice(2,10)}.jpg`;
      const tipe = 'dp';
      const created_at = new Date(Date.now() - randInt(0, 15) * 24*3600*1000);
      const payment = await models.Payment.create({ id_order: order.id_order, id_customer: order.id_customer, no_transaksi: order.no_transaksi, no_hp: phone, nominal, bukti, tipe, status, tanggal: created_at, created_at, updated_at: created_at });
      payments.push(payment);
    }
    console.log('Payments created:', payments.length);

    // Recompute order payments and update dp_bayar/status_bayar/status accordingly
    for (const order of orders) {
      const totalPaid = await models.Payment.sum('nominal', { where: { no_transaksi: order.no_transaksi } }) || 0;
      let paymentStatus = 'belum_lunas';
      let orderWorkflowStatus = order.status || 'pending';
      let orderBotStatus = order.status_bot || 'pending';
      if (totalPaid >= Number(order.total_bayar || 0) && Number(order.total_bayar || 0) > 0) {
        paymentStatus = 'lunas';
        orderWorkflowStatus = 'selesai';
        orderBotStatus = 'selesai';
      } else if (totalPaid > 0) {
        paymentStatus = 'dp';
        orderWorkflowStatus = 'proses';
      }
      await models.Order.update({ dp_bayar: totalPaid, status_bayar: paymentStatus, status: orderWorkflowStatus, status_bot: orderBotStatus, updated_at: new Date() }, { where: { id_order: order.id_order } });
    }

    // Create piutangs per customer if outstanding
    let piutangCount = 0;
    for (const cust of customers) {
      const custOrders = await models.Order.findAll({ where: { id_customer: cust.id_customer } });
      let totalOutstanding = 0;
      for (const o of custOrders) {
        const paid = await models.Payment.sum('nominal', { where: { no_transaksi: o.no_transaksi } }) || 0;
        const remaining = Number(o.total_bayar || 0) - Number(paid || 0);
        if (remaining > 0) totalOutstanding += remaining;
      }
      if (totalOutstanding > 0) {
        await models.Piutang.create({ id_customer: cust.id_customer, jumlah_piutang: totalOutstanding, paid: 0.00, tanggal_piutang: new Date(), status: 'belum_lunas', created_at: new Date(), updated_at: new Date() });
        piutangCount++;
      }
    }
    console.log('Piutangs created for customers:', piutangCount);

    console.log('\nSeed complete. Summary:');
    console.log('Customers:', customers.length);
    console.log('Products ensured:', products.length);
    console.log('Orders:', orders.length);
    console.log('Payments:', payments.length);
    console.log('Piutangs:', piutangCount);

    process.exit(0);
  } catch (err) {
    console.error('Error seeding data', err);
    process.exit(1);
  }
}

main();
