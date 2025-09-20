"use strict";
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class InvoiceToken extends Model {
    static associate(models) {
      // InvoiceToken links to Order by no_transaksi
      InvoiceToken.belongsTo(models.Order, { foreignKey: 'no_transaksi', targetKey: 'no_transaksi' });
    }
  }

  InvoiceToken.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    token: {
      type: DataTypes.STRING(128),
      allowNull: false
    },
    no_transaksi: {
      type: DataTypes.STRING,
      allowNull: false
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    used_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    meta: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'InvoiceToken',
    tableName: 'invoice_tokens',
    timestamps: false
  });

  return InvoiceToken;
};
