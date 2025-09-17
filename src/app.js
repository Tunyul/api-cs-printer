'use strict';

/**
 * @swagger
 * tags:
 *   - name: Auth
 *   - name: Customer
 *   - name: Product
 *   - name: Order
 *   - name: OrderDetail
 *   - name: Payment
 *   - name: Piutang
 */

const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const { swaggerUi, specs } = require('../swagger/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use('/api/customers', require('./routes/customer'));
app.use('/api/orders', require('./routes/order'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/product'));
app.use('/api/order-detail', require('./routes/orderDetail'));
app.use('/api/payments', require('./routes/payment'));
app.use('/api/piutangs', require('./routes/piutang'));
app.use('/api/bot', require('./routes/bot').router);

app.get('/', (req, res) => {
  res.json({
    message: 'Cukong API is running',
    version: '1.0.0'
  });
});

sequelize.authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.');
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log('Database synchronized successfully.');
  })
  .catch(err => {
    console.error('Unable to connect or sync to the database:', err);
    process.exit(1);
  });

const models = require('./models');
app.set('models', models);

module.exports = app;