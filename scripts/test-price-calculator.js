const { computeOrderDetailPrice } = require('../src/utils/priceCalculator');

// Example: product priced at 25k per m2, banner 3x3 meters
const product = {
  id_produk: 999,
  nama_produk: 'Test Banner 3x3',
  harga_per_m2: 25000,
  unit_area: 1,
  pricing_unit: 'm2'
};

const dimension = { w: 3, h: 3, unit: 'm' }; // 3m x 3m
const qty = 1;

const res = computeOrderDetailPrice(product, { dimension }, qty);
console.log('Result for 3x3 m, qty 1 at 25k/m2:', res);

// Another: product quantity 10, same banner priced per pcs/harga_per_pcs
const product2 = { id_produk: 1, nama_produk: 'Print Document A4', harga_per_pcs: 1500, pricing_unit: 'pcs' };
const res2 = computeOrderDetailPrice(product2, {}, 10);
console.log('Result for A4 qty 10:', res2);
