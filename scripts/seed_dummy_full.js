/*
  Seed script to create:
  - 30 customers
  - each customer 3-7 orders with random totals and statuses
  - for orders with outstanding amounts, create Piutang rows
  - create payments for some orders (some verified, some pending)

  Usage: node scripts/seed_dummy_full.js
  WARNING: This will insert data into your development DB. Use in dev only.
*/

const models = require('../src/models');

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function run() {
  await models.sequelize.authenticate();
  console.log('Connected to DB');

  const statuses = ['pending','proses','selesai','batal'];
  const status_bayar = ['belum_lunas','dp','lunas'];

  const firstNames = ['Ahmad','Budi','Cici','Dewi','Eka','Fajar','Gina','Hendra','Intan','Joko','Kiki','Lina','Maya','Nina','Oki','Putri','Roni','Sari','Tono','Uli','Vina','Wira','Xena','Yanto','Zara','Raka','Dita','Agus','Bima','Candra'];
  const dateStart = new Date('2025-09-01T00:00:00Z');
  const dateEnd = new Date('2025-09-19T23:59:59Z');

  for (let i = 1; i <= 30; i++) {
    const nama = pick(firstNames) + ' ' + pick(firstNames);
    const no_hp = `0812${String(10000000 + i)}`;
    // use valid enum value for tipe_customer and null for batas_piutang to match model
    const customer = await models.Customer.create({ nama, no_hp, tipe_customer: 'reguler', batas_piutang: null, created_at: new Date(), updated_at: new Date() });

    const ordersCount = randInt(3,7);
    // fetch products to choose from
    const products = await models.Product.findAll();
    for (let o = 0; o < ordersCount; o++) {
      const chosenCount = randInt(1,3);
      const chosen = [];
      let total = 0;
      for (let c = 0; c < chosenCount; c++) {
        const prod = pick(products);
        const qty = randInt(1, 20);
        const harga = Number(prod.harga_per_pcs || 0);
        const subtotal = qty * harga;
        chosen.push({ prod, qty, harga, subtotal });
        total += subtotal;
      }
  const status = pick(statuses);
  const statusbayar = pick(status_bayar);
  const orderDate = randomDate(dateStart, dateEnd);
  const order = await models.Order.create({ id_customer: customer.id_customer, no_transaksi: `TRX-D${i}-${o}-${Date.now()}`, tanggal_order: orderDate, status_urgensi: 'normal', total_bayar: total, dp_bayar: statusbayar === 'dp' ? Math.floor(total*0.3) : (statusbayar === 'lunas' ? total : 0), status_bayar: statusbayar, tanggal_jatuh_tempo: new Date(orderDate.getTime()+7*24*3600*1000), link_invoice: '', link_drive: '', status_bot: pick(['pending','selesai']), status_order: status, created_at: orderDate, updated_at: orderDate, total_harga: total, status: status });
      // create OrderDetail rows
      for (const item of chosen) {
        await models.OrderDetail.create({ id_order: order.id_order, id_produk: item.prod.id_produk || item.prod.id, quantity: item.qty, harga_satuan: item.harga, subtotal_item: item.subtotal });
      }
      // create piutang if not fully paid
      const remaining = total - Number(order.dp_bayar || 0);
      if (remaining > 0) {
        await models.Piutang.create({ id_customer: customer.id_customer, jumlah_piutang: remaining, paid: 0.00, tanggal_piutang: orderDate, status: 'belum_lunas', created_at: orderDate, updated_at: orderDate });
      }
      // create payments (0-2 payments per order)
      const paymentsCount = randInt(0,2);
      for (let p = 0; p < paymentsCount; p++) {
        const isVerified = Math.random() < 0.5;
        const nominal = isVerified ? Math.floor(Math.random() * (total)) : 0;
        await models.Payment.create({ no_transaksi: order.no_transaksi, no_hp: customer.no_hp, nominal, bukti: isVerified ? `https://example.com/bukti-${i}-${o}-${p}.jpg` : null, tipe: isVerified ? (Math.random()<0.5 ? 'dp' : 'pelunasan') : 'dp', status: isVerified ? 'verified' : 'menunggu_verifikasi', created_at: orderDate, updated_at: orderDate });
      }
    }
    if (i % 5 === 0) console.log(`Created ${i} customers`);
  }
  console.log('Done seeding');
  process.exit(0);
}

run().catch(e=>{ console.error(e); process.exit(1); });
