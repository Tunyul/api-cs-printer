const assert = require('assert');
const request = require('supertest');
const proxyquire = require('proxyquire');
const express = require('express');

function setMockModelsCache(mockModels) {
  const modelsPath = require.resolve('../src/models');
  const original = require.cache[modelsPath];
  require.cache[modelsPath] = { id: modelsPath, filename: modelsPath, loaded: true, exports: mockModels };
  return function restore() {
    if (original) {
      require.cache[modelsPath] = original;
    } else {
      delete require.cache[modelsPath];
    }
  };
}

describe('GET /api/bot/order-by-phone', function() {
  it('should return 400 when no_hp missing', async function() {
    // create an express app and mount the bot router with mocked models
    const mockModels = {};
    process.env.BOT_API_KEY = 'supersemar1998';
    process.env.NODE_ENV = 'test';
    const botModule = proxyquire('../src/routes/bot', { '../models': mockModels });
    const app = express();
    app.use(express.json());
    app.use('/api/bot', botModule.router);
    await request(app)
      .get('/api/bot/order-by-phone')
      .set('x-bot-key', 'supersemar1998')
      .expect(400)
      .then(res => {
        assert(res.body.error && res.body.error.includes('no_hp'));
      });
  });

  it('should return 404 when customer not found', async function() {
    const mockModels = {
      Customer: {
        findOne: async () => null
      }
    };
    process.env.BOT_API_KEY = 'supersemar1998';
    process.env.NODE_ENV = 'test';
    const botModule = proxyquire('../src/routes/bot', { '../models': mockModels });
    const app = express();
    app.use(express.json());
    app.use('/api/bot', botModule.router);
    await request(app)
      .get('/api/bot/order-by-phone')
      .query({ no_hp: '6285' })
      .set('x-bot-key', 'supersemar1998')
      .expect(404)
      .then(res => {
        assert(res.body.error && res.body.error.includes('Customer'));
      });
  });

  it('should return 200 with order and order_details when found', async function() {
    const mockOrder = { id_order: 1, no_transaksi: 'T123' };
    const mockModels = {
      Customer: {
        findOne: async () => ({ id_customer: 1 })
      },
      Order: {
        findOne: async () => mockOrder
      },
      OrderDetail: {
        findAll: async () => ([{ id_order: 1, id_product: 2, qty: 3 }])
      }
    };
      process.env.BOT_API_KEY = 'supersemar1998';
      process.env.NODE_ENV = 'test';
      const botModule = proxyquire('../src/routes/bot', { '../models': mockModels });
      const app = express();
      app.use(express.json());
      app.use('/api/bot', botModule.router);
    await request(app)
      .get('/api/bot/order-by-phone')
      .query({ no_hp: '6285' })
      .set('x-bot-key', 'supersemar1998')
      .then(res => {
        if (res.status !== 200) {
          console.log('DEBUG RESPONSE:', res.status, res.body);
        }
        assert(res.status === 200, `Expected 200, got ${res.status}`);
        assert(res.body.order && res.body.order.no_transaksi === 'T123');
        assert(Array.isArray(res.body.order_details));
      });
  });
});
