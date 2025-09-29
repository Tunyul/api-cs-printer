'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Uix extends Model {
    static associate(models) {
      // no associations for now
    }
  }

  Uix.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    subtitle: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('draft','published','archived'),
      allowNull: false,
      defaultValue: 'draft'
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    score: {
      type: DataTypes.DECIMAL(6,2),
      allowNull: true
    },
    tags: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    meta: {
      type: DataTypes.JSON,
      allowNull: true
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    published_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    views: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    color: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    reference_code: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Uix',
    tableName: 'uix',
    timestamps: false
  });

  return Uix;
};
