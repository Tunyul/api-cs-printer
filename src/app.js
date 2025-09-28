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
const session = require('express-session');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware (used for monitor login). Secret uses JWT_SECRET fallback.
const sessionSecret = process.env.SESSION_SECRET || process.env.JWT_SECRET || 'please_change_this_secret';
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 } // 1 hour
}));


const { swaggerUi, specs } = require('../swagger/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use('/api/customers', require('./routes/customer'));
app.use('/api/orders', require('./routes/order'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/product'));
app.use('/api/order-detail', require('./routes/orderDetail'));
app.use('/api/payments', require('./routes/payment'));
app.use('/api/piutangs', require('./routes/piutang'));
app.use('/api/invoices', require('./routes/invoice'));
app.use('/api/bot', require('./routes/bot').router);
// Public invoice PDF and webhook notify endpoints
app.use('/invoice', require('./routes/publicInvoice'));
// Healthcheck
app.use('/health', require('./routes/health'));
// Notifications
app.use('/api/notifications', require('./routes/notification'));
app.use('/api/uix', require('./routes/uix'));

// Internal monitor for quick debugging (not exposed in swagger)
app.use('/internal/monitor', require('./routes/internalMonitor'));

app.get('/', (req, res) => {
  res.json({
    message: 'Cukong API is running',
    version: '2.0.1'
  });
});

if (process.env.NODE_ENV !== 'test') {
  sequelize.authenticate()
    .then(() => {
      console.log('Database connection has been established successfully.');
      return sequelize.sync({ alter: true });
    })
    .then(() => {
      console.log('Database synchronized successfully.');
    })
    .catch(err => {
      // Log DB errors but don't kill the whole process so the app can still serve
      // public endpoints or webhook flows that don't require DB during testing.
      console.error('Unable to connect or sync to the database (continuing without DB):', err);
      // Note: routes that depend on the DB will still fail at runtime.
    });
} else {
  // In test environment, skip DB connection/sync to allow unit tests to import app without DB
  console.log('Running in test mode: skipping DB authenticate/sync');
}

const models = require('./models');
app.set('models', models);
// export session options for controllers if needed
app.set('sessionOptions', { sessionKey: 'monitor_logged_in' });

module.exports = app;