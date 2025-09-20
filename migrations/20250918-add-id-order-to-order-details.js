"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1) Add nullable id_order column
    await queryInterface.addColumn('order_details', 'id_order', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    // 2) Backfill from existing order_id column if present
    // Note: If your table already uses `order_id` column, copy values to `id_order`.
    // If not present, this UPDATE will be ignored by most DBs; if your DB errors, run the appropriate SQL manually.
    try {
      await queryInterface.sequelize.query(
        'UPDATE order_details SET id_order = order_id WHERE id_order IS NULL AND order_id IS NOT NULL'
      );
    } catch (err) {
      // ignore errors here; the DB may not have order_id column
      console.warn('Backfill skipped: ', err.message);
    }

    // 3) If you want to enforce NOT NULL, uncomment the change below.
    try {
      await queryInterface.changeColumn('order_details', 'id_order', {
        type: Sequelize.INTEGER,
        allowNull: false
      });
    } catch (err) {
      // If change to NOT NULL fails (because some rows are still null), leave it nullable and warn
      console.warn('Could not set id_order NOT NULL automatically. Please backfill remaining rows then set NOT NULL manually.');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('order_details', 'id_order');
  }
};
