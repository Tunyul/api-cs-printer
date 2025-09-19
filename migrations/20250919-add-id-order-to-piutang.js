"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('piutang', 'id_order', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'orders', key: 'id_order' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('piutang', 'id_order');
  }
};
