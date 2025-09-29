const paymentController = require('../src/controllers/paymentController');
const models = require('../src/models');

async function main() {
  try {
    // pick a verified payment (change id as needed)
    const p = await models.Payment.findOne({ where: { status: 'verified' } });
    if (!p) return console.log('No verified payment found');
    console.log('Testing allocation for payment', p.id_payment || p.id);
    const res = await paymentController.__test_syncPaymentEffects(p);
    console.log('Result:', res);
    const allocs = await models.PaymentAllocation.findAll({ where: { id_payment: p.id_payment || p.id } });
    console.log('Allocations for payment:', allocs.map(a=>({ id_alloc: a.id_alloc||a.id, id_piutang: a.id_piutang, amount: a.amount })));
  } catch (e) {
    console.error(e && e.message ? e.message : e);
    process.exit(1);
  }
}

main();
