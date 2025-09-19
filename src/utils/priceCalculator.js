// priceCalculator.js
// Helper to compute harga_satuan and subtotal for order details.
// Supports products priced per m2 (harga_per_m2) and per-pcs (harga_per_pcs).

function toNumber(v) {
  if (v == null || v === '') return 0;
  return Number(v);
}

function roundTwo(v) {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

/**
 * computeOrderDetailPrice
 * @param {Object} product - product record (should include harga_per_m2, unit_area, pricing_unit, harga_per_pcs)
 * @param {Object} options - { dimension: { w, h, unit } } for area-based pricing
 *   - dimension.w and .h are numbers (e.g., 3 and 3) and unit is 'm' or 'cm' (default: 'm')
 * @param {Number} qty - quantity ordered
 *
 * Returns: { harga_satuan, subtotal_item, areaPerUnit }
 */
function computeOrderDetailPrice(product = {}, { dimension } = {}, qty = 1) {
  const hargaPerM2 = toNumber(product.harga_per_m2 || product.harga_per_m2 === 0 ? product.harga_per_m2 : 0);
  const hargaPerPcs = toNumber(product.harga_per_pcs || 0);
  const pricingUnit = (product.pricing_unit || 'm2').toLowerCase();
  const unitAreaDefault = toNumber(product.unit_area || 1);

  let areaPerUnit = 1; // in m2

  if (pricingUnit === 'm2') {
    if (dimension && (dimension.w != null) && (dimension.h != null)) {
      const unit = (dimension.unit || 'm').toLowerCase();
      let w = toNumber(dimension.w);
      let h = toNumber(dimension.h);
      if (unit === 'cm') {
        w = w / 100;
        h = h / 100;
      }
      // area in m2
      areaPerUnit = roundTwo(w * h);
    } else {
      // fallback to product.unit_area if provided
      areaPerUnit = unitAreaDefault || 1;
    }
  } else {
    // pricing unit not m2, default to unit_area for calculations
    areaPerUnit = unitAreaDefault || 1;
  }

  let harga_satuan = 0;
  if (hargaPerM2 > 0 && pricingUnit === 'm2') {
    harga_satuan = hargaPerM2 * areaPerUnit;
  } else if (hargaPerPcs > 0) {
    harga_satuan = hargaPerPcs;
  } else {
    harga_satuan = 0;
  }

  harga_satuan = roundTwo(harga_satuan);
  const subtotal_item = roundTwo(harga_satuan * qty);

  return { harga_satuan, subtotal_item, areaPerUnit };
}

module.exports = { computeOrderDetailPrice, roundTwo };
