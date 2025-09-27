require('dotenv').config();
const models = require('../src/models');
const { v4: uuidv4 } = require('uuid');
const paymentCtrl = require('../src/controllers/paymentController');
const syncPaymentEffects = paymentCtrl.syncPaymentEffects;
const ensurePiutangForCustomer = paymentCtrl.ensurePiutangForCustomer || (async () => {});

function formatNo(i){ const d=new Date(); return `TRX-${d.getFullYear()}${('0'+(d.getMonth()+1)).slice(-2)}${('0'+(d.getDate())).slice(-2)}-00${i}-CICI`; }

(async ()=>{
  try {
    const customers = [];
    // ensure at least 3 customers
    for (let i=0;i<3;i++){
      const no_hp = '62888063' + (1200 + i).toString().slice(-4);
      let c = await models.Customer.findOne({ where: { no_hp } });
      if (!c) c = await models.Customer.create({ nama: `Seed Cust ${i+1}`, no_hp, tipe_customer: 'reguler', created_at: new Date(), updated_at: new Date() });
      customers.push(c);
    }

    const results = [];

    // Order 1: no payments
  const o1 = await models.Order.create({ no_transaksi: formatNo(1), id_customer: customers[0].id_customer, tanggal_order: new Date(), total_harga: 150000, total_bayar: 150000, dp_bayar: 0, status_bayar: 'belum_lunas', status_order: 'pending', status_bot: 'pending', status: 'pending', status_urgensi: 'normal', tanggal_jatuh_tempo: new Date(Date.now() + 7*24*3600*1000), created_at: new Date(), updated_at: new Date() });
    results.push({ no_transaksi: o1.no_transaksi, id_order: o1.id_order, total_bayar: o1.total_bayar, total_paid: 0, status: o1.status });

    // Order 2: full verified payment
  const o2 = await models.Order.create({ no_transaksi: formatNo(2), id_customer: customers[1].id_customer, tanggal_order: new Date(), total_harga: 300000, total_bayar: 300000, dp_bayar: 0, status_bayar: 'lunas', status_order: 'proses', status_bot: 'pending', status: 'pending', status_urgensi: 'normal', tanggal_jatuh_tempo: new Date(Date.now() + 7*24*3600*1000), created_at: new Date(), updated_at: new Date() });
    const p2 = await models.Payment.create({ no_transaksi: o2.no_transaksi, no_hp: customers[1].no_hp, nominal: 300000, status: 'verified', tipe: 'pelunasan', tanggal: new Date(), bukti: `https://example.com/bukti/${uuidv4()}.jpg` });
    await ensurePiutangForCustomer(customers[1].id_customer).catch(()=>{});
    await syncPaymentEffects(p2, null, { skipOrderWebhook: true, skipOrderStatusUpdate: true });
    const paid2 = await models.Payment.sum('nominal', { where: { no_transaksi: o2.no_transaksi } }) || 0;
    results.push({ no_transaksi: o2.no_transaksi, id_order: o2.id_order, total_bayar: o2.total_bayar, total_paid: Number(paid2), status: (await models.Order.findByPk(o2.id_order)).status });

    // Order 3: dp pending (menunggu_verifikasi)
  const o3 = await models.Order.create({ no_transaksi: formatNo(3), id_customer: customers[2].id_customer, tanggal_order: new Date(), total_harga: 500000, total_bayar: 500000, dp_bayar: 0, status_bayar: 'dp', status_order: 'pending', status_bot: 'pending', status: 'pending', status_urgensi: 'normal', tanggal_jatuh_tempo: new Date(Date.now() + 7*24*3600*1000), created_at: new Date(), updated_at: new Date() });
    const p3 = await models.Payment.create({ no_transaksi: o3.no_transaksi, no_hp: customers[2].no_hp, nominal: 50000, status: 'menunggu_verifikasi', tipe: 'dp', tanggal: new Date(), bukti: `https://example.com/bukti/${uuidv4()}.jpg` });
    await ensurePiutangForCustomer(customers[2].id_customer).catch(()=>{});
    await syncPaymentEffects(p3, null, { skipOrderWebhook: true, skipOrderStatusUpdate: true });
    const paid3 = await models.Payment.sum('nominal', { where: { no_transaksi: o3.no_transaksi } }) || 0;
    results.push({ no_transaksi: o3.no_transaksi, id_order: o3.id_order, total_bayar: o3.total_bayar, total_paid: Number(paid3), status: (await models.Order.findByPk(o3.id_order)).status });

    console.log('Seeded 3 orders:');
    console.log(results);
    process.exit(0);
  } catch (err) {
    console.error('seed err', err);
    process.exit(1);
  }
})();
