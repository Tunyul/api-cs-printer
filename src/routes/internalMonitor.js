const express = require('express');
const router = express.Router();
const controller = require('../controllers/monitorController');

// Optional simple auth: set MONITOR_KEY env and client must send x-monitor-key header
function monitorAuth(req, res, next) {
  const key = process.env.MONITOR_KEY;
  if (!key) return next();
  // allow key via header or query param for browser usage
  const header = req.headers['x-monitor-key'];
  const q = req.query && req.query.monitor_key;
  if ((header && header === key) || (q && q === key)) return next();
  return res.status(403).json({ error: 'Forbidden' });
}

router.get('/', monitorAuth, controller.monitor);
router.get('/sse', monitorAuth, controller.sseStream);
router.get('/live', monitorAuth, controller.livePage);
router.get('/metrics', monitorAuth, controller.metricsHandler);

module.exports = router;
