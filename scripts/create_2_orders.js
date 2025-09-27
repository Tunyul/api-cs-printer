require('dotenv').config();
const models = require('../src/models');

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function formatNo(){ const d=new Date(); return `TRX-${d.getFullYear()}${('0'+(d.getMonth()+1)).slice(-2)}${('0'+d.getDate()).slice(-2)}-${String(Math.floor(Math.random()*9000)+1000)}-2`; }

(async ()=>{
  try {
    const results = [];
    for (let i=1;i<=2;i++){
      const no_hp = '62888063' + (3000 + i).toString().slice(-4);
      let cust = await models.Customer.findOne({ where: { no_hp } });
      if (!cust) cust = await models.Customer.create({ nama: `Auto Cust 2-${i}`, no_hp, tipe_customer: 'reguler', created_at: new Date(), updated_at: new Date() });

      const total = rnd(100000, 800000);
      const order = await models.Order.create({
        no_transaksi: formatNo(),
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
        catatan: `Created by create_2_orders.js #${i}`
      });

      console.log(`Created order ${order.no_transaksi} (id_order=${order.id_order})`);
      results.push({ no_transaksi: order.no_transaksi, id_order: order.id_order });
    }

    console.log('Done:', results);
    process.exit(0);
  } catch (err) {
    console.error('error', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
