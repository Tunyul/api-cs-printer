"use strict";

/**
 * Migration: repurpose products.ukuran_standar from free-form string into ENUM('pcs','m')
 * Strategy:
 *  - add temporary column ukuran_standar_old to copy current string values
 *  - set new ukuran_standar enum column with default 'pcs'
 *  - backfill new enum using parse heuristic: if old value matches NxM(m|cm) -> 'm' else 'pcs'
 *  - drop ukuran_standar_old
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1) add temp copy
    await queryInterface.addColumn('products', 'ukuran_standar_old', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.sequelize.query(`UPDATE products SET ukuran_standar_old = ukuran_standar`);

  // 2) create new columns: enum ukuran_standar and unit_area
  await queryInterface.removeColumn('products', 'ukuran_standar');
  await queryInterface.addColumn('products', 'ukuran_standar', { type: Sequelize.ENUM('pcs','m'), allowNull: true, defaultValue: 'pcs' });
  await queryInterface.addColumn('products', 'unit_area', { type: Sequelize.DECIMAL(10,2), allowNull: true });

    // 3) backfill: set to 'm' if ukuran_standar_old matches dimension pattern like '6x2m' or '600x200cm'
    // Use SQL regexp (MySQL REGEXP) or fallback JS update depending on dialect
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === 'mysql') {
      await queryInterface.sequelize.query(`UPDATE products SET ukuran_standar = 'm' WHERE ukuran_standar_old REGEXP '^[[:space:]]*[0-9]+(\\.[0-9]+)?[x×][[:space:]]*[0-9]+(\\.[0-9]+)?(m|cm)?[[:space:]]*$'`);
      // set unit_area from parsed ukuran_standar_old (MySQL not great at float math in regexp, do in JS below)
    } else if (dialect === 'postgres') {
      await queryInterface.sequelize.query(`UPDATE products SET ukuran_standar = 'm' WHERE ukuran_standar_old ~* '^[\\s]*[0-9]+(\\.[0-9]+)?[x×][\\s]*[0-9]+(\\.[0-9]+)?(m|cm)?[\\s]*$'`);
    }

    // Backfill unit_area using JS loop (works across dialects)
    const products = await queryInterface.sequelize.query(`SELECT id_produk, ukuran_standar_old FROM products`, { type: Sequelize.QueryTypes.SELECT });
    const re = /^\s*(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)(m|cm)?\s*$/i;
    for (const p of products) {
      const m = String(p.ukuran_standar_old || '').match(re);
      if (m) {
        let w = Number(m[1]);
        let h = Number(m[2]);
        const unit = (m[3] || 'cm').toLowerCase();
        if (unit === 'cm') { w = w / 100; h = h / 100; }
        const area = Math.round((w * h + Number.EPSILON) * 100) / 100;
        await queryInterface.sequelize.query(`UPDATE products SET unit_area = ${area} WHERE id_produk = ${p.id_produk}`);
        await queryInterface.sequelize.query(`UPDATE products SET ukuran_standar = 'm' WHERE id_produk = ${p.id_produk}`);
      } else {
        await queryInterface.sequelize.query(`UPDATE products SET ukuran_standar = 'pcs' WHERE id_produk = ${p.id_produk}`);
      }
    }

    // 4) drop temp column
    await queryInterface.removeColumn('products', 'ukuran_standar_old');

    return Promise.resolve();
  },

  down: async (queryInterface, Sequelize) => {
    // revert: add string column back, fill from enum values (set to null for 'm' because original size lost)
    await queryInterface.addColumn('products', 'ukuran_standar_old', { type: Sequelize.STRING, allowNull: true });
    // copy enum values to old
    await queryInterface.sequelize.query(`UPDATE products SET ukuran_standar_old = ukuran_standar`);
    await queryInterface.removeColumn('products', 'ukuran_standar');
    await queryInterface.addColumn('products', 'ukuran_standar', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.sequelize.query(`UPDATE products SET ukuran_standar = ukuran_standar_old`);
    await queryInterface.removeColumn('products', 'ukuran_standar_old');

    // drop enum type in Postgres
    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_products_ukuran_standar"');
    }

    return Promise.resolve();
  }
};
