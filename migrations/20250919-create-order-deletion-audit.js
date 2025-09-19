"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('order_deletion_audits', {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
      id_order: { type: Sequelize.INTEGER, allowNull: false },
      deleted_by: { type: Sequelize.STRING(100), allowNull: true },
      reason: { type: Sequelize.TEXT, allowNull: true },
      snapshot_json: { type: Sequelize.LONGTEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('order_deletion_audits');
  }
};
