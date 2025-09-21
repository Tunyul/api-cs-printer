const app = require('../src/app');
const request = require('supertest');
const models = require('../src/models');

async function run() {
  await models.sequelize.sync();
  let customer = await models.Customer.findOne({ where: { no_hp: '1234' } });
  if (!customer) {
    customer = await models.Customer.create({ nama: 'Test', no_hp: '1234' });
  }
  let product = await models.Product.findByPk(3);
  if (!product) {
    product = await models.Product.create({ nama_produk: 'P3', harga_per_pcs: 10000, created_at: new Date(), updated_at: new Date() });
  }

  const res = await request(app)
    .post('/api/orders')
    .send({ no_hp: 1234, order_details: [{ id_product: 3, qty: 2 }] });

  console.log('status', res.status);
  console.log('body', res.body);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
