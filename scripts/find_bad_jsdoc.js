const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');
const fs = require('fs');
const glob = require('glob');

const files = glob.sync('./src/routes/*.js');
console.log('Checking files:', files.length);
for (const f of files) {
  const opts = {
    definition: {
      openapi: '3.0.0',
      info: { title: 'tmp', version: '1.0.0' }
    },
    apis: [f]
  };
  try {
    swaggerJsdoc(opts);
    console.log('OK:', f);
  } catch (e) {
    console.error('ERROR in', f, e.message);
    // print a snippet from file to help debug
    const content = fs.readFileSync(f, 'utf8');
    console.log(content.split('\n').slice(0,120).join('\n'));
    process.exit(1);
  }
}
console.log('All route files OK');
