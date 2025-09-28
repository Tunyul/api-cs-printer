const express = require('express');
const router = express.Router();
const controller = require('../controllers/monitorController');

// Optional simple auth: set MONITOR_KEY env and client must send x-monitor-key header
function monitorAuth(req, res, next) {
  const key = process.env.MONITOR_KEY;
  if (!key) return next();
  // allow session-based login, header, or query param
  const sessionKey = req.session && req.session.monitor_authenticated;
  const header = req.headers['x-monitor-key'];
  const q = req.query && req.query.monitor_key;
  if (sessionKey) return next();
  if ((header && header === key) || (q && q === key)) return next();
  return res.status(403).json({ error: 'Forbidden' });
}

router.get('/', monitorAuth, controller.monitor);
router.get('/sse', monitorAuth, controller.sseStream);
// allow the live UI to load without authentication; the page will prompt for the key
router.get('/live', controller.livePage);
router.get('/metrics', monitorAuth, controller.metricsHandler);

// session-based login/logout
router.post('/login', controller.login);
router.post('/logout', controller.logout);

// Also allow GET /login?monitor_key=... as a convenience (avoids JSON body parsing issues)
router.get('/login', controller.login);

module.exports = router;
