'use strict';

const models = require('../models');
const { Op } = require('sequelize');

async function list(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 25;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    const where = {};
    if (req.query.q) {
      where[Op.or] = [
        { title: { [Op.like]: `%${req.query.q}%` } },
        { subtitle: { [Op.like]: `%${req.query.q}%` } },
        { tags: { [Op.like]: `%${req.query.q}%` } }
      ];
    }
  const { rows, count } = await models.Uix.findAndCountAll({ where, limit, offset, order: [['id', 'DESC']] });
  // Return items directly (no `data` wrapper) as requested.
  res.json(rows);
  } catch (err) {
    console.error('Uix list error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getById(req, res) {
  try {
    const id = parseInt(req.params.id);
    const item = await models.Uix.findByPk(id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    console.error('Uix get error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function create(req, res) {
  try {
    const payload = req.body;
    payload.created_at = new Date();
    payload.updated_at = new Date();
    const item = await models.Uix.create(payload);
    res.status(201).json(item);
  } catch (err) {
    console.error('Uix create error', err);
    res.status(400).json({ error: err.message || 'Bad request' });
  }
}

async function update(req, res) {
  try {
    const id = parseInt(req.params.id);
    const item = await models.Uix.findByPk(id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    const payload = req.body;
    payload.updated_at = new Date();
    await item.update(payload);
    res.json(item);
  } catch (err) {
    console.error('Uix update error', err);
    res.status(400).json({ error: err.message || 'Bad request' });
  }
}

async function remove(req, res) {
  try {
    const id = parseInt(req.params.id);
    const item = await models.Uix.findByPk(id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    await item.destroy();
    res.json({ message: 'deleted' });
  } catch (err) {
    console.error('Uix delete error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove
};
