const jwt = require('jsonwebtoken');
const models = require('../models');

module.exports = async function (req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token tidak ditemukan' });
  try {
  const secret = process.env.JWT_SECRET || 'secretkey';
  const decoded = jwt.verify(token, secret);
    req.user = decoded;
    // Ambil user dari database untuk cek role
    const user = await models.User.findByPk(decoded.id_user);
    if (!user) return res.status(401).json({ error: 'User tidak ditemukan' });
    req.user.role = user.role;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token tidak valid' });
  }
};
