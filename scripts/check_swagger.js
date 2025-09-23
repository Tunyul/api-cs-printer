// scripts/check_swagger.js
try {
  const mod = require('../swagger/swagger');
  const s = mod.specs;
  const paths = Object.keys(s.paths || {}).filter(p => p.startsWith('/api/uix'));
  console.log('Uix schema present:', !!(s.components && s.components.schemas && s.components.schemas.Uix));
  console.log('Uix paths:', paths);
  process.exit(0);
} catch (e) {
  console.error('ERROR', e && e.toString());
  process.exit(1);
}
