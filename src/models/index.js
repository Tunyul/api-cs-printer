'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';

// Load database configuration from database.js
const { database, username, password, host, dialect } = require('../config/database.js');

const db = {};

let sequelize;
sequelize = new Sequelize(database, username, password, {
  host: host,
  dialect: dialect,
  logging: false // disable logging in production
});

// Load all models
const customer = require('./customer')(sequelize, Sequelize.DataTypes);
const product = require('./product')(sequelize, Sequelize.DataTypes);
const order = require('./order')(sequelize, Sequelize.DataTypes);
const orderDetail = require('./orderDetail')(sequelize, Sequelize.DataTypes);
const piutang = require('./piutang')(sequelize, Sequelize.DataTypes);
const payment = require('./payment')(sequelize, Sequelize.DataTypes);
const orderDeletionAudit = require('./orderDeletionAudit')(sequelize, Sequelize.DataTypes);
const user = require('./user')(sequelize);
const invoiceToken = require('./invoiceToken')(sequelize, Sequelize.DataTypes);
const notification = require('./notification')(sequelize, Sequelize.DataTypes);
const uix = require('./uix')(sequelize, Sequelize.DataTypes);

db.Customer = customer;
db.Product = product;
db.Order = order;
db.OrderDetail = orderDetail;
db.Piutang = piutang;
db.Payment = payment;
db.OrderDeletionAudit = orderDeletionAudit;
db.User = user;
db.InvoiceToken = invoiceToken;
db.Notification = notification;
db.Uix = uix;

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;