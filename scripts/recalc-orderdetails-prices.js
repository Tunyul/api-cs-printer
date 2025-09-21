/*
Recalculate order_details where harga_satuan==0 or subtotal_item==0 for m2-priced products.
- Uses product.ukuran_standar (e.g. '100x50cm' or '3x3m') when available
- Fallback to product.unit_area when parsing fails
- Updates order_details.harga_satuan and subtotal_item
- Recalculates order.total_harga and order.total_bayar per order

Run: node scripts/recalc-orderdetails-prices.js
WARNING: Destructive if schema differs; review before running in production.
*/

const models = require('../src/models');
const { computeOrderDetailPrice } = require('../src/utils/priceCalculator');

function toNumber(v) {
  if (v == null || v === '') return 0;
  return Number(v);
}

function parseSizeString(s) {
  if (!s || typeof s !== 'string') return null;
  // normalize: remove spaces
  const ss = s.trim().toLowerCase();
  // match patterns like '100x50cm', '3x3m', '3 x 3 m', '300x500 mm' (mm not supported)
  const m = ss.match(/^(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)(m|cm)?$/);
  if (m) {
    const w = Number(m[1]);
    const h = Number(m[2]);
    const unit = m[3] || 'm';
    return { w, h, unit };
  }
  return null;
}

(async () => {
  try {
    await models.sequelize.authenticate();
    console.log('Connected to DB');

    // Find order_details where harga_satuan == 0 OR subtotal_item == 0
    const details = await models.OrderDetail.findAll({
      where: models.sequelize.or(
        { harga_satuan: 0 },
        { subtotal_item: 0 },
        { harga_satuan: null },
        { subtotal_item: null }
      ),
      include: [ { model: models.Product }, { model: models.Order } ],
      order: [['id_order', 'ASC']]
    });

    if (!details || details.length === 0) {
      console.log('No order_details with zero price found.');
      process.exit(0);
    }

    console.log(`Found ${details.length} order_details to inspect`);

    // Group by order
    const byOrder = {};
    for (const d of details) {
      const od = d.toJSON ? d.toJSON() : d;
      const orderId = od.id_order;
      if (!byOrder[orderId]) byOrder[orderId] = [];
      byOrder[orderId].push(od);
    }

    let updatedCount = 0;
    for (const orderIdStr of Object.keys(byOrder)) {
      const orderId = Number(orderIdStr);
      console.log('\nProcessing order', orderId);
      const t = await models.sequelize.transaction();
      try {
        const rows = byOrder[orderId];
        for (const od of rows) {
          const prod = od.Product || (await models.Product.findByPk(od.id_produk));
          if (!prod) {
            console.warn(`Product ${od.id_produk} not found, skipping detail ${od.id}`);
            continue;
          }

          const pricingUnit = (prod.pricing_unit || 'm2').toLowerCase();
          if (pricingUnit !== 'm2' || toNumber(prod.harga_per_m2) <= 0) {
            console.log(`Detail ${od.id} product not m2-priced or no harga_per_m2, skipping`);
            continue;
          }

          // try to get dimension from product.ukuran_standar
          let parsed = null;
          if (prod.ukuran_standar) {
            parsed = parseSizeString(prod.ukuran_standar);
            if (parsed) console.log(`Parsed ukuran_standar for product ${prod.id_produk}:`, prod.ukuran_standar, '->', parsed);
          }

          // if not parsed, try to get dimension from order detail metadata (none in current schema) - skip
          // fallback to unit_area
          if (!parsed && prod.unit_area) {
            const ua = toNumber(prod.unit_area);
            if (ua > 0) {
              // treat unit_area as m2 directly
              parsed = null; // signal use unit_area
              console.log(`Using unit_area for product ${prod.id_produk}:`, ua);
            }
          }

          let computeRes = null;
          if (parsed) {
            computeRes = computeOrderDetailPrice(prod, { dimension: parsed }, od.quantity || 1);
          } else if (toNumber(prod.unit_area) > 0) {
            // product.unit_area available, call helper with no dimension so it uses unit_area
            computeRes = computeOrderDetailPrice(prod, {}, od.quantity || 1);
          } else {
            console.warn(`No dimension or unit_area for product ${prod.id_produk}, cannot compute price for detail ${od.id}`);
            continue;
          }

          if (!computeRes) {
            console.warn(`Compute failed for detail ${od.id}`);
            continue;
          }

          const [affected] = await models.OrderDetail.update({ harga_satuan: computeRes.harga_satuan, subtotal_item: computeRes.subtotal_item }, { where: { id: od.id }, transaction: t });
          if (affected > 0) {
            updatedCount++;
            console.log(`Updated detail ${od.id}: harga_satuan=${computeRes.harga_satuan}, subtotal_item=${computeRes.subtotal_item}`);
          }
        }

        // After updating details for this order, recompute totals
        const recal = await models.OrderDetail.findAll({ where: { id_order: orderId }, attributes: [[models.sequelize.fn('SUM', models.sequelize.col('subtotal_item')), 'sumSubtotal']] , transaction: t });
        const sumSubtotal = recal && recal[0] && recal[0].dataValues ? Number(recal[0].dataValues.sumSubtotal || 0) : 0;
        const order = await models.Order.findByPk(orderId, { transaction: t });
        if (order) {
          // update order total_harga and total_bayar
          await order.update({ total_harga: sumSubtotal, total_bayar: sumSubtotal }, { transaction: t });
          console.log(`Order ${orderId} totals updated to ${sumSubtotal}`);
        }

        await t.commit();
      } catch (e) {
        await t.rollback();
        console.error('Transaction failed for order', orderId, e);
      }
    }

    console.log('\nDone. Updated', updatedCount, 'order_details.');
    process.exit(0);
  } catch (e) {
    console.error('Error', e);
    process.exit(1);
  }
})();
