const models = require('../src/models');

async function run() {
  await models.sequelize.sync();
  console.log('DB synced');

  // create customer
  const customer = await models.Customer.create({ nama: 'Maulana', no_hp: '1111', created_at: new Date(), updated_at: new Date() });
  console.log('Customer created', customer.id_customer);

  // create two orders with totals
  const now = new Date();
  const trxBase = Date.now();
  const trx1 = `TRX-TEST-${trxBase}-1`;
  const trx2 = `TRX-TEST-${trxBase}-2`;
  const order1 = await models.Order.create({ id_customer: customer.id_customer, no_transaksi: trx1, total_bayar: 100000, status_bot: 'selesai', total_harga: 100000, tanggal_order: now, status_urgensi: 'normal', status_bayar: 'belum_lunas', tanggal_jatuh_tempo: now, status_order: 'confirmed', created_at: now, updated_at: now });
  const order2 = await models.Order.create({ id_customer: customer.id_customer, no_transaksi: trx2, total_bayar: 50000, status_bot: 'selesai', total_harga: 50000, tanggal_order: now, status_urgensi: 'normal', status_bayar: 'belum_lunas', tanggal_jatuh_tempo: now, status_order: 'confirmed', created_at: now, updated_at: now });
  console.log('Orders created', order1.id_order, order2.id_order);

  // ensure piutang helper is in paymentController; call it by requiring controller
  const paymentController = require('../src/controllers/paymentController');

  // ensure piutang exists
  await paymentController.ensurePiutangForCustomer(customer.id_customer);

  const piutangsBefore = await models.Piutang.findAll({ where: { id_customer: customer.id_customer } });
  console.log('Piutangs before:', piutangsBefore.map(p => ({ id: p.id_piutang, jumlah: p.jumlah_piutang, paid: p.paid, status: p.status })));

  // create a payment via model directly simulating admin verified payment
  const payment = await models.Payment.create({ id_order: order1.id_order, id_customer: customer.id_customer, no_transaksi: order1.no_transaksi, no_hp: customer.no_hp, nominal: 100000, tipe: 'pelunasan', status: 'confirmed', created_at: new Date(), updated_at: new Date() });
  console.log('Payment created', payment.id_payment);

  // call sync to allocate
  await paymentController.syncPaymentEffects(payment);

  const piutangsAfter = await models.Piutang.findAll({ where: { id_customer: customer.id_customer } });
  console.log('Piutangs after:', piutangsAfter.map(p => ({ id: p.id_piutang, jumlah: p.jumlah_piutang, paid: p.paid, status: p.status })));

  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
