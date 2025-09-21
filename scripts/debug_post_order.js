const request = require('supertest');
const app = require('../src/app');

(async () => {
  try {
    const res = await request(app)
      .post('/api/orders')
      .send({ no_hp: 1234, order_details: [{ id_product: 3, qty: 2 }] });
    console.log('STATUS:', res.status);
    console.log('BODY:', res.body);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
