require('dotenv').config();
const models = require('../src/models');
const { v4: uuidv4 } = require('uuid');
const { syncPaymentEffects, ensurePiutangForCustomer } = require('../src/controllers/paymentController');

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function formatNo() { const d = new Date(); return `TRX-${d.getFullYear()}${('0'+(d.getMonth()+1)).slice(-2)}${('0'+d.getDate()).slice(-2)}-${String(Math.floor(Math.random()*9000)+1000)}-CICI`; }

(async () => {
  try {
    console.log('Preparing customers...');
    // ensure a small pool of customers exists
    const custCount = 12;
    const customers = [];
    for (let i=0;i<custCount;i++){
      const no_hp = '62888063' + (1000 + i).toString().slice(-4);
      let c = await models.Customer.findOne({ where: { no_hp } });
      if (!c) {
        c = await models.Customer.create({ nama: `Customer ${i}`, no_hp, tipe_customer: i%3===0 ? 'hutang' : 'reguler', created_at: new Date(), updated_at: new Date() });
      }
      customers.push(c);
    }

    console.log('Creating 40 orders with varied payments and piutangs...');
    const results = [];
    for (let i=0;i<40;i++){
      const cust = customers[i % customers.length];
      const no_transaksi = formatNo();
      const total_harga = rnd(50000, 1500000);
      // some orders have extra fees/discount
      const extra = rnd(-20000, 50000);
      const total_bayar = Math.max(0, total_harga + extra);

      const order = await models.Order.create({
        no_transaksi,
        id_customer: cust.id_customer,
        tanggal_order: new Date(),
        status_urgensi: 'normal',
        total_bayar: total_bayar,
        dp_bayar: 0,
        status_bayar: 'belum_lunas',
        tanggal_jatuh_tempo: new Date(Date.now() + 7*24*3600*1000),
        link_invoice: null,
        link_drive: null,
        status_bot: 'pending',
        status_order: 'pending',
        created_at: new Date(),
        updated_at: new Date(),
        total_harga: total_harga,
        status: 'pending',
        catatan: `Seeded order #${i+1}`
      });

      // create piutang for some customers randomly
      if (Math.random() < 0.4) {
        const jumlah_piutang = rnd(20000, 200000);
        const paid = Math.random() < 0.5 ? rnd(0, jumlah_piutang) : 0;
        const status = paid >= jumlah_piutang ? 'lunas' : 'belum_lunas';
        await models.Piutang.create({ id_customer: cust.id_customer, jumlah_piutang, paid, tanggal_piutang: new Date(), status, created_at: new Date(), updated_at: new Date() });
      }

      // decide payment pattern
      const pattern = rnd(0,4); // 0..4
      const paymentsCreated = [];
      if (pattern === 0) {
        // no payment
      } else if (pattern === 1) {
        // dp only, sometimes verified
        const dp = Math.round(total_bayar * (rnd(10,40)/100));
        const status = Math.random() < 0.6 ? 'verified' : (Math.random()<0.5 ? 'pending' : 'menunggu_verifikasi');
        const p = await models.Payment.create({ no_transaksi, no_hp: cust.no_hp, nominal: dp, status, tipe: 'dp', tanggal: new Date(), bukti: status==='verified' ? `https://example.com/bukti/${uuidv4()}.jpg` : null });
        paymentsCreated.push(p);
      } else if (pattern === 2) {
        // full payment verified
        const p = await models.Payment.create({ no_transaksi, no_hp: cust.no_hp, nominal: total_bayar, status: 'verified', tipe: 'pelunasan', tanggal: new Date(), bukti: `https://example.com/bukti/${uuidv4()}.jpg` });
        paymentsCreated.push(p);
      } else if (pattern === 3) {
        // bukti submitted, waiting verification
        const p = await models.Payment.create({ no_transaksi, no_hp: cust.no_hp, nominal: 0, status: 'menunggu_verifikasi', tipe: 'dp', tanggal: new Date(), bukti: `https://example.com/bukti/${uuidv4()}.jpg` });
        paymentsCreated.push(p);
      } else if (pattern === 4) {
        // multiple payments: dp verified + remainder pending or partial verified
        const dp = Math.round(total_bayar * (rnd(10,30)/100));
        const p1 = await models.Payment.create({ no_transaksi, no_hp: cust.no_hp, nominal: dp, status: 'verified', tipe: 'dp', tanggal: new Date(), bukti: `https://example.com/bukti/${uuidv4()}.jpg` });
        paymentsCreated.push(p1);
        // remainder maybe pending or verified
        const remainder = total_bayar - dp;
        if (Math.random() < 0.5) {
          const p2 = await models.Payment.create({ no_transaksi, no_hp: cust.no_hp, nominal: remainder, status: 'pending', tipe: 'pelunasan', tanggal: new Date() });
          paymentsCreated.push(p2);
        } else {
          const p2 = await models.Payment.create({ no_transaksi, no_hp: cust.no_hp, nominal: remainder, status: 'verified', tipe: 'pelunasan', tanggal: new Date(), bukti: `https://example.com/bukti/${uuidv4()}.jpg` });
          paymentsCreated.push(p2);
        }
      }

      // run sync effects for each payment created; decide whether to allow order.status update
      for (const pay of paymentsCreated) {
        const allowOrderStatusUpdate = (pay.status === 'verified' && Math.random() < 0.6); // sometimes update public status
        await ensurePiutangForCustomer(pay.id_customer || cust.id_customer);
        await syncPaymentEffects(pay, null, { skipOrderWebhook: true, skipOrderStatusUpdate: !allowOrderStatusUpdate });
      }

      // summary
      const totalPaidNow = await models.Payment.sum('nominal', { where: { no_transaksi } }) || 0;
      const finalOrder = await models.Order.findOne({ where: { no_transaksi } });
      results.push({ no_transaksi, id_order: finalOrder.id_order, total_bayar: finalOrder.total_bayar, total_paid: Number(totalPaidNow), status: finalOrder.status, status_order: finalOrder.status_order });
    }

    console.log('Created 40 orders. Summary (first 10):');
    console.log(results.slice(0,10));
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('seed error', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
