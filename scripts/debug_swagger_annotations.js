const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const options = require('../swagger/swagger').specs ? null : require('../swagger/swagger');
console.log('loading options from swagger/swagger.js');
const opts = require('../swagger/swagger').options || require('../swagger/swagger');
try {
  const specs = swaggerJsdoc(opts);
  console.log('built ok');
} catch (e) {
  console.error('Error building swagger:', e.message);
  console.error(e.stack);
}
