/*
  Demo seed: create 5 customers (prefixed DemoUser) + orders/orderdetails/piutang/payments
  Safe for quick verification.
  Usage: node scripts/seed_demo_5.js
*/

const models = require('../src/models');

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomDate(start, end) { return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())); }

async function run() {
  await models.sequelize.authenticate();
  console.log('Connected to DB');

  const statuses = ['pending','proses','selesai','batal'];
  const status_bayar = ['belum_lunas','dp','lunas'];
  const firstNames = ['Ahmad','Budi','Cici','Dewi','Eka','Fajar','Gina','Hendra','Intan','Joko','Kiki','Lina','Maya','Nina','Oki','Putri','Roni','Sari','Tono','Uli','Vina','Wira','Xena','Yanto','Zara','Raka','Dita','Agus','Bima','Candra'];
  const dateStart = new Date('2025-09-01T00:00:00Z');
  const dateEnd = new Date('2025-09-19T23:59:59Z');

  const products = await models.Product.findAll();
  if (!products || products.length === 0) {
    console.error('No products found - aborting demo');
    process.exit(1);
  }

  const createdCustomers = [];

  for (let i = 1; i <= 5; i++) {
  const nama = 'DemoUser' + String(i).padStart(2,'0') + ' ' + pick(firstNames);
  const no_hp = `081300${Date.now().toString().slice(-6)}${i}`;
  const customer = await models.Customer.create({ nama, no_hp, tipe_customer: 'reguler', batas_piutang: null, created_at: new Date(), updated_at: new Date() });

    const ordersCount = randInt(3,5);
    const createdOrders = [];

    for (let o = 0; o < ordersCount; o++) {
      const chosenCount = randInt(1,3);
      const chosen = [];
      let total = 0;
      for (let c = 0; c < chosenCount; c++) {
        const prod = pick(products);
        const qty = randInt(1, 10);
        const harga = Number(prod.harga_per_pcs || 0);
        const subtotal = qty * harga;
        chosen.push({ prod, qty, harga, subtotal });
        total += subtotal;
      }
      const status = pick(statuses);
      const statusbayar = pick(status_bayar);
      const orderDate = randomDate(dateStart, dateEnd);
      const no_trx = `DEMO-TRX-${Date.now()}-${i}-${o}`;
      const order = await models.Order.create({ id_customer: customer.id_customer, no_transaksi: no_trx, tanggal_order: orderDate, status_urgensi: 'normal', total_bayar: total, dp_bayar: statusbayar === 'dp' ? Math.floor(total*0.3) : (statusbayar === 'lunas' ? total : 0), status_bayar: statusbayar, tanggal_jatuh_tempo: new Date(orderDate.getTime()+7*24*3600*1000), link_invoice: '', link_drive: '', status_bot: pick(['pending','selesai']), status_order: status, created_at: orderDate, updated_at: orderDate, total_harga: total, status: status });

      for (const item of chosen) {
        await models.OrderDetail.create({ id_order: order.id_order, id_produk: item.prod.id_produk || item.prod.id, quantity: item.qty, harga_satuan: item.harga, subtotal_item: item.subtotal });
      }

      const remaining = total - Number(order.dp_bayar || 0);
      if (remaining > 0) {
        await models.Piutang.create({ id_customer: customer.id_customer, jumlah_piutang: remaining, paid: 0.00, tanggal_piutang: orderDate, status: 'belum_lunas', created_at: orderDate, updated_at: orderDate });
      }

      const paymentsCount = randInt(0,2);
      const createdPayments = [];
      for (let p = 0; p < paymentsCount; p++) {
        const isVerified = Math.random() < 0.5;
        const nominal = isVerified ? Math.floor(Math.random() * (total)) : 0;
        const payment = await models.Payment.create({ no_transaksi: order.no_transaksi, no_hp: customer.no_hp, nominal, bukti: isVerified ? `https://example.com/bukti-demo-${i}-${o}-${p}.jpg` : null, tipe: isVerified ? (Math.random()<0.5 ? 'dp' : 'pelunasan') : 'dp', status: isVerified ? 'verified' : 'menunggu_verifikasi', created_at: orderDate, updated_at: orderDate });
        createdPayments.push(payment.get({ plain: true }));
      }

      createdOrders.push({ order: order.get({ plain: true }), payments: createdPayments });
    }

    createdCustomers.push({ customer: customer.get({ plain: true }), orders: createdOrders });
    console.log(`Demo customer created: ${customer.nama} (${customer.no_hp}) with ${createdOrders.length} orders`);
  }

  // summary
  console.log('--- Summary ---');
  console.log(JSON.stringify(createdCustomers, null, 2));
  process.exit(0);
}

run().catch(e=>{ console.error(e); process.exit(1); });
