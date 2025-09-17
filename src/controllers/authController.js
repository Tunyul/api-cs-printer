const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const models = require('../models');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password wajib diisi' });
    }
    const user = await models.User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }
    const token = jwt.sign({ id_user: user.id_user, username: user.username, role: user.role }, 'secretkey', { expiresIn: '1d' });
    res.json({ token, user: { id_user: user.id_user, username: user.username, nama: user.nama, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { username, password, nama, role } = req.body;
    if (!username || !password || !nama) {
      return res.status(400).json({ error: 'Username, password, dan nama wajib diisi' });
    }
    const exist = await models.User.findOne({ where: { username } });
    if (exist) {
      return res.status(400).json({ error: 'Username sudah digunakan' });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await models.User.create({ username, password: hash, nama, role: role || 'user' });
    res.status(201).json({ id_user: user.id_user, username: user.username, nama: user.nama, role: user.role });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
