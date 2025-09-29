// src/controllers/orderDetailController.js
const models = require('../models');
const { computeOrderDetailPrice } = require('../utils/priceCalculator');

exports.createOrderDetail = async (req, res) => {
  try {
    // Expect body to contain: id_order, id_produk, quantity, optional dimension/size
    const body = req.body;
    if (!body.id_order || !body.id_produk || !body.quantity) return res.status(400).json({ error: 'id_order, id_produk, quantity wajib diisi' });
    const product = await models.Product.findByPk(body.id_produk);
    if (!product) return res.status(404).json({ error: 'Product tidak ditemukan' });

    const qty = Number(body.quantity || 1);

    // parse dimension
    function parseDimension(d) {
      if (!d) return null;
      if (typeof d === 'object' && d.w != null && d.h != null) return { w: Number(d.w), h: Number(d.h), unit: d.unit || 'm' };
      if (typeof d === 'string') {
        const m = d.trim().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)(m|cm)?$/);
        if (m) return { w: Number(m[1]), h: Number(m[2]), unit: m[3] || 'm' };
      }
      if (d.width != null && d.height != null) return { w: Number(d.width), h: Number(d.height), unit: d.unit || 'm' };
      return null;
    }

    let harga_satuan = 0;
    let subtotal_item = 0;
    const pricingUnit = (product.pricing_unit || 'm2').toLowerCase();
    if (pricingUnit === 'm2' && Number(product.harga_per_m2 || 0) > 0) {
      // prefer explicit dimension in request; otherwise try product.unit_area (backfilled)
      const dimSource = body.dimension || body.size || { width: body.width, height: body.height, unit: body.unit };
      const parsed = parseDimension(dimSource);
      if (!parsed) {
        // try using product.unit_area
        const unitArea = product.unit_area != null ? Number(product.unit_area) : null;
        if (!unitArea) return res.status(400).json({ error: 'Dimension required for m2-priced products (e.g. size: "3x3m" or dimension:{w:3,h:3,unit:"m"})' });
        // compute using unit_area fallback (computeOrderDetailPrice will use unit_area when dimension=null)
        const prodPlain = product.toJSON ? product.toJSON() : Object.assign({}, product);
        const computeRes = computeOrderDetailPrice(prodPlain, { dimension: null }, qty);
        const harga_satuan = computeRes.harga_satuan;
        const subtotal_item = computeRes.subtotal_item;
        const created = await models.OrderDetail.create({
          id_order: body.id_order,
          id_produk: body.id_produk,
          quantity: qty,
          harga_satuan,
          subtotal_item
        });
        const orderDetailWithProduct = await models.OrderDetail.findByPk(created.id, { include: [models.Product] });
        return res.status(201).json(orderDetailWithProduct);
      }
      const computeRes = computeOrderDetailPrice(product.toJSON ? product.toJSON() : product, { dimension: parsed }, qty);
      harga_satuan = computeRes.harga_satuan;
      subtotal_item = computeRes.subtotal_item;
    } else {
      const harga = Number(product.harga_per_pcs || 0);
      harga_satuan = harga;
      subtotal_item = harga * qty;
    }

    const created = await models.OrderDetail.create({
      id_order: body.id_order,
      id_produk: body.id_produk,
      quantity: qty,
      harga_satuan,
      subtotal_item
    });
    const orderDetailWithProduct = await models.OrderDetail.findByPk(created.id, {
      include: [models.Product]
    });
    res.status(201).json(orderDetailWithProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOrderDetailsByOrderId = async (req, res) => {
  try {
    // gunakan parameter path `order_id` dan filter berdasarkan kolom `id_order`
    const orderId = req.params.order_id;
    const orderDetails = await models.OrderDetail.findAll({
      where: { id_order: orderId },
      include: [models.Product]
    });
    if (!orderDetails || orderDetails.length === 0) {
      return res.status(404).json({ error: 'Order details not found' });
    }
    res.status(200).json(orderDetails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOrderDetailById = async (req, res) => {
  try {
    const orderDetail = await models.OrderDetail.findByPk(req.params.id, {
      include: [models.Product]
    });
    if (!orderDetail) {
      return res.status(404).json({ error: 'Order detail not found' });
    }
    res.status(200).json(orderDetail);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateOrderDetail = async (req, res) => {
  try {
    const [updated] = await models.OrderDetail.update(req.body, {
      where: { id: req.params.id }
    });
    if (updated) {
      const updatedOrderDetail = await models.OrderDetail.findByPk(req.params.id, {
        include: [models.Product]
      });
  res.status(200).json(updatedOrderDetail);
    } else {
      res.status(404).json({ error: 'Order detail not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteOrderDetail = async (req, res) => {
  try {
    const deleted = await models.OrderDetail.destroy({
      where: { id: req.params.id }
    });
    if (deleted) {
      res.status(200).json({ message: 'Order detail deleted successfully' });
    } else {
      res.status(404).json({ error: 'Order detail not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllOrderDetails = async (req, res) => {
  try {
    const orderDetails = await models.OrderDetail.findAll({
      include: [models.Product]
    });
    res.status(200).json(orderDetails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};