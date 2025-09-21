const models = require('../src/models');
const { computeOrderDetailPrice } = require('../src/utils/priceCalculator');

(async () => {
  try {
    await models.sequelize.authenticate();
    const product = await models.Product.findByPk(5);
    console.log('Product 5 from DB:', product && product.toJSON ? product.toJSON() : product);
    const res = computeOrderDetailPrice(product ? product.toJSON() : {}, { dimension: { w: 3, h: 3, unit: 'm' } }, 1);
    console.log('Computed price for 3x3m:', res);
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
