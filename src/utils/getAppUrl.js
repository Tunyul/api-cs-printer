const os = require('os');

function getLocalIPv4() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

module.exports = function getAppUrl() {
  const cfg = process.env.APP_URL || '';
  if (cfg && cfg.trim() !== '' && !cfg.includes('localhost') && !cfg.includes('127.0.0.1')) {
    return cfg.replace(/\/$/, '');
  }
  // If APP_URL is localhost or not set, build a LAN URL using server IP and PORT
  const ip = getLocalIPv4();
  const port = process.env.PORT || '3000';
  if (ip) return `http://${ip}:${port}`;
  // fallback to http://localhost:PORT
  return `http://localhost:${port}`;
};
