'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('uix', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      subtitle: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('draft','published','archived'),
        allowNull: false,
        defaultValue: 'draft'
      },
      priority: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      score: {
        type: Sequelize.DECIMAL(6,2),
        allowNull: true
      },
      tags: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'comma separated tags for UI testing'
      },
      meta: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'free-form JSON metadata'
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      published_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      views: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      color: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      reference_code: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });
  },

  async down(queryInterface) {
    // Drop enum type first for some DBs (handled automatically by Sequelize in most setups)
    await queryInterface.dropTable('uix');
  }
};
