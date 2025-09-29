#!/usr/bin/env node
// scripts/update_products_ukuran_standar.js
// Safe script to backfill product.unit_area and normalize ukuran_standar to 'm' or 'pcs'.
// Usage: node scripts/update_products_ukuran_standar.js
// This script will:
//  - detect whether `unit_area` column exists
//  - iterate products and for each product where ukuran_standar looks like a dimension (e.g. '6x2m' or '600x200cm'),
//    compute area in m2 and set unit_area and ukuran_standar='m'
//  - otherwise set ukuran_standar='pcs' for non-parseable values
// The script asks for confirmation before applying changes.

const readline = require('readline');
const models = require('../src/models');
const sequelize = models.sequelize;

function parseSizeToArea(ukuran) {
  if (!ukuran) return null;
  const m = String(ukuran).trim().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)(m|cm)?$/i);
  if (!m) return null;
  let w = Number(m[1]);
  let h = Number(m[2]);
  const unit = (m[3] || 'cm').toLowerCase();
  if (unit === 'cm') { w = w / 100; h = h / 100; }
  const area = Math.round((w * h + Number.EPSILON) * 100) / 100;
  return area;
}

async function detectSchema() {
  const dialect = sequelize.getDialect();
  let hasUnitArea = false;
  let ukuranType = null;
  if (dialect === 'mysql') {
    const [cols] = await sequelize.query("SHOW COLUMNS FROM products LIKE 'unit_area'");
    hasUnitArea = cols && cols.length > 0;
    const [cols2] = await sequelize.query("SHOW COLUMNS FROM products LIKE 'ukuran_standar'");
    if (cols2 && cols2.length > 0) ukuranType = cols2[0].Type;
  } else if (dialect === 'postgres') {
    const res = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='products' AND column_name IN ('unit_area','ukuran_standar')", { type: sequelize.QueryTypes.SELECT });
    hasUnitArea = res.some(r => r.column_name === 'unit_area');
    const u = res.find(r => r.column_name === 'ukuran_standar');
    ukuranType = u ? u.data_type : null;
  } else {
    // generic: try reading one row and checking fields
    const [one] = await sequelize.query("SELECT * FROM products LIMIT 1", { type: sequelize.QueryTypes.SELECT });
    hasUnitArea = one && Object.prototype.hasOwnProperty.call(one, 'unit_area');
    ukuranType = one && Object.prototype.hasOwnProperty.call(one, 'ukuran_standar') ? typeof one.ukuran_standar : null;
  }
  return { hasUnitArea, ukuranType };
}

async function planUpdates() {
  const products = await sequelize.query("SELECT id_produk, nama_produk, ukuran_standar FROM products", { type: sequelize.QueryTypes.SELECT });
  const plan = [];
  for (const p of products) {
    const old = p.ukuran_standar;
    const area = parseSizeToArea(old);
    if (area != null) {
      plan.push({ id: p.id_produk, nama: p.nama_produk, from: old, to_unit: 'm', unit_area: area });
    } else {
      plan.push({ id: p.id_produk, nama: p.nama_produk, from: old, to_unit: 'pcs', unit_area: null });
    }
  }
  return plan;
}

async function applyChanges(plan, hasUnitArea) {
  const t = await sequelize.transaction();
  try {
    for (const p of plan) {
      if (hasUnitArea && p.unit_area != null) {
        await sequelize.query(`UPDATE products SET unit_area = ?, ukuran_standar = ? WHERE id_produk = ?`, { replacements: [p.unit_area, p.to_unit, p.id], transaction: t });
      } else {
        // either no unit_area column or unit_area null: set ukuran_standar only
        await sequelize.query(`UPDATE products SET ukuran_standar = ? WHERE id_produk = ?`, { replacements: [p.to_unit, p.id], transaction: t });
      }
    }
    await t.commit();
    return true;
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

async function main() {
  console.log('Detecting DB schema...');
  try {
    await sequelize.authenticate();
  } catch (err) {
    console.error('DB connection failed:', err.message || err);
    process.exit(1);
  }
  const { hasUnitArea, ukuranType } = await detectSchema();
  console.log('Dialect:', sequelize.getDialect());
  console.log('unit_area column exists:', hasUnitArea);
  console.log('ukuran_standar column type:', ukuranType);

  const plan = await planUpdates();
  const summary = plan.reduce((acc, p) => { acc[p.to_unit] = (acc[p.to_unit] || 0) + 1; return acc; }, {});
  console.log('Planned updates summary:', summary);
  console.log('Sample changes (first 20):');
  console.table(plan.slice(0, 20));

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('Apply these changes to DB? Type YES to proceed: ', async (ans) => {
    rl.close();
    if (ans !== 'YES') {
      console.log('Aborted by user. No changes made.');
      process.exit(0);
    }
    try {
      console.log('Applying changes...');
      await applyChanges(plan, hasUnitArea);
      console.log('Finished updates successfully.');
      process.exit(0);
    } catch (err) {
      console.error('Failed to apply changes:', err.message || err);
      process.exit(1);
    }
  });
}

if (require.main === module) {
  main();
}
