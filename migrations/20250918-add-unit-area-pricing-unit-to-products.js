"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('products', 'unit_area', {
      type: Sequelize.DECIMAL(10,4),
      allowNull: true,
      defaultValue: 1.0000
    });
    await queryInterface.addColumn('products', 'pricing_unit', {
      type: Sequelize.STRING(10),
      allowNull: false,
      defaultValue: 'm2'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('products', 'unit_area');
    await queryInterface.removeColumn('products', 'pricing_unit');
  }
};
