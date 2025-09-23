// scripts/seed_uix.js
// Run with: node scripts/seed_uix.js

const models = require('../src/models');

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomColor() {
  const colors = ['red','green','blue','yellow','purple','orange','teal','pink','brown','black','white'];
  return randChoice(colors);
}

const titles = ['Lorem','Quick Test','Sample Item','Entry','Demo','Placeholder','Widget','Gadget','Component','Module','Card','Row','Cell','Panel','Tile'];
const subtitles = ['sub A','sub B','alpha','beta','gamma','delta','epsilon','zeta','eta','theta'];
const tagsPool = ['ui','ux','test','sample','random','alpha','beta','v2','new','legacy'];

function randomTags() {
  const count = randInt(0,4);
  const picked = new Set();
  for (let i=0;i<count;i++) picked.add(randChoice(tagsPool));
  return Array.from(picked).join(',');
}

function randomMeta(i) {
  return { seedIndex: i, flag: Math.random() < 0.5, values: [randInt(1,100), randInt(100,999)] };
}

function randomRef(i) {
  return `REF-${String(Date.now()).slice(-6)}-${i}`;
}

async function main() {
  try {
    await models.sequelize.authenticate();
    console.log('DB connected');

  // Ensure tables exist (create Uix table if migration hasn't been run)
  await models.sequelize.sync({ alter: true });

  const items = [];
    for (let i=0;i<50;i++) {
      const title = `${randChoice(titles)} ${i+1}`;
      const subtitle = randChoice(subtitles);
      const description = `Auto-generated description ${i+1} - ${Math.random().toString(36).slice(2,12)}`;
      const status = randChoice(['draft','published','archived']);
      const priority = randInt(0,10);
      const score = (Math.random() * 100).toFixed(2);
      const tags = randomTags();
      const meta = randomMeta(i);
      const active = Math.random() < 0.85;
      const published_at = Math.random() < 0.6 ? new Date(Date.now() - randInt(0, 30)*24*3600*1000) : null;
      const views = randInt(0,5000);
      const color = randomColor();
      const reference_code = randomRef(i);
      const now = new Date();

      items.push({ title, subtitle, description, status, priority, score, tags, meta, active, published_at, views, color, reference_code, created_at: now, updated_at: now });
    }

    // bulkInsert via model to ensure validations
    for (const it of items) {
      await models.Uix.create(it).catch(e => console.warn('create warn', e.message || e));
    }

    const total = await models.Uix.count();
    console.log('Inserted items, total Uix rows:', total);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding uix', err);
    process.exit(1);
  }
}

main();
