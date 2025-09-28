require('dotenv').config();
(async()=>{
  const no = process.argv[2];
  if(!no){
    console.error('Usage: node scripts/check_tx.js <NO_TRANSAKSI>');
    process.exit(2);
  }
  try{
    const models = require('../src/models');
    // wait for sequelize authenticate if available
    if(models && models.sequelize){
      try{ await models.sequelize.authenticate(); } catch(e) { console.error('DB authenticate error:', e.message); }
    }
    const order = await models.Order.findOne({ where: { no_transaksi: no }, include: [models.Customer] });
    console.log('\n=== ORDER ===');
    if(!order) console.log('Order not found'); else console.log(JSON.stringify(order.get({plain:true}), null, 2));

    const payments = await models.Payment.findAll({ where: { no_transaksi: no }, include: [{ model: models.Order, attributes: ['id_order','no_transaksi'] }, { model: models.Customer, attributes: ['id_customer','nama','no_hp'] } ], order: [['tanggal','ASC']] });
    console.log('\n=== PAYMENTS ('+payments.length+') ===');
    payments.forEach(p => console.log(JSON.stringify(p.get({plain:true}), null, 2)));

    const totalPaid = await models.Payment.sum('nominal', { where: { no_transaksi: no } }) || 0;
    console.log('\nTotal paid for transaction:', totalPaid);

    if(order){
      const piutangs = await models.Piutang.findAll({ where: { id_order: order.id_order } });
      console.log('\n=== PIUTANGS for order ('+piutangs.length+') ===');
      piutangs.forEach(p => console.log(JSON.stringify(p.get({plain:true}), null, 2)));

      const customerPiutangs = await models.Piutang.findAll({ where: { id_customer: order.id_customer } });
      console.log('\n=== PIUTANGS for customer ('+customerPiutangs.length+') ===');
      customerPiutangs.forEach(p => console.log(JSON.stringify(p.get({plain:true}), null, 2)));

      const allocations = await models.PaymentAllocation.findAll({ where: { }, order: [['tanggal_alloc','DESC']], limit: 200 });
      console.log('\n=== LATEST ALLOCATIONS (sample) count='+allocations.length+' ===');
      allocations.slice(0,50).forEach(a => console.log(JSON.stringify(a.get({plain:true}), null, 2)));

      // show computed totals
      const sisaBayar = Number((Number(order.total_bayar || 0) - Number(totalPaid || 0)).toFixed(2));
      console.log('\nComputed sisa_bayar:', sisaBayar);
      console.log('Order.status_bayar:', order.status_bayar, 'Order.status:', order.status, 'Order.dp_bayar:', order.dp_bayar);
    }

    process.exit(0);
  }catch(e){
    console.error('Error running check:', e && e.stack ? e.stack : e);
    process.exit(3);
  }
})();
