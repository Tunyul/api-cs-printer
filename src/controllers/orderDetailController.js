// src/controllers/orderDetailController.js
const models = require('../models');

exports.createOrderDetail = async (req, res) => {
  try {
    const orderDetail = await models.OrderDetail.create(req.body);
    const orderDetailWithProduct = await models.OrderDetail.findByPk(orderDetail.id, {
      include: [models.Product]
    });
    res.status(201).json(orderDetailWithProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOrderDetailsByOrderId = async (req, res) => {
  try {
    const orderDetails = await models.OrderDetail.findAll({
      where: { order_id: req.params.id },
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