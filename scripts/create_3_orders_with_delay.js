require('dotenv').config();
const models = require('../src/models');

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function formatNo(i){ const d=new Date(); return `TRX-${d.getFullYear()}${('0'+(d.getMonth()+1)).slice(-2)}${('0'+d.getDate()).slice(-2)}-${String(Math.floor(Math.random()*9000)+1000)}-${i}`; }

async function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

(async ()=>{
  try {
    const results = [];
    for (let i=1;i<=3;i++){
      // ensure a customer exists
      const no_hp = '62888063' + (2000 + i).toString().slice(-4);
      let cust = await models.Customer.findOne({ where: { no_hp } });
      if (!cust) cust = await models.Customer.create({ nama: `Delay Cust ${i}`, no_hp, tipe_customer: 'reguler', created_at: new Date(), updated_at: new Date() });

      const total = rnd(50000, 500000);
      const order = await models.Order.create({
        no_transaksi: formatNo(i),
        id_customer: cust.id_customer,
        tanggal_order: new Date(),
        total_harga: total,
        total_bayar: total,
        dp_bayar: 0,
        status_bayar: 'belum_lunas',
        status_order: 'pending',
        status_bot: 'pending',
        status: 'pending',
        status_urgensi: 'normal',
        tanggal_jatuh_tempo: new Date(Date.now() + 7*24*3600*1000),
        created_at: new Date(),
        updated_at: new Date(),
        catatan: `Created by delay script #${i}`
      });

      console.log(`Created order ${order.no_transaksi} (id_order=${order.id_order})`);
      results.push({ no_transaksi: order.no_transaksi, id_order: order.id_order });

      if (i < 3) {
        console.log('Waiting 5s before next order...');
        await sleep(5000);
      }
    }

    console.log('All done:', results);
    process.exit(0);
  } catch (err) {
    console.error('error creating orders', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
