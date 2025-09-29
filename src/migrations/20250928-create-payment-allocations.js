"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payment_allocations', {
      id_alloc: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      id_payment: { type: Sequelize.INTEGER, allowNull: false },
      id_piutang: { type: Sequelize.INTEGER, allowNull: false },
      amount: { type: Sequelize.DECIMAL(15,2), allowNull: false, defaultValue: 0.00 },
      tanggal_alloc: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      note: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('payment_allocations');
  }
};
