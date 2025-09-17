// src/models/order.js
'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.Customer, { foreignKey: 'id_customer' });
      Order.hasMany(models.OrderDetail, { foreignKey: 'id_order' });
    }
  }

  Order.init({
    id_order: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    no_transaksi: {
      type: DataTypes.STRING,
      allowNull: false
    },
    id_customer: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    tanggal_order: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status_urgensi: {
      type: DataTypes.STRING,
      allowNull: false
    },
    total_bayar: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false,
      defaultValue: 0.00
    },
    dp_bayar: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true,
      defaultValue: 0.00
    },
    status_bayar: {
      type: DataTypes.STRING,
      allowNull: false
    },
    tanggal_jatuh_tempo: {
      type: DataTypes.DATE,
      allowNull: false
    },
    link_invoice: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    link_drive: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status_bot: {
      type: DataTypes.ENUM('pending','selesai'),
      allowNull: false,
      defaultValue: 'pending'
    },
    status_order: {
      type: DataTypes.STRING,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    total_harga: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending','proses','selesai','batal'),
      allowNull: true,
      defaultValue: 'pending'
    },
    catatan: {
      type: DataTypes.TEXT,
      allowNull: true
    },
  }, {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    timestamps: false
  });

  return Order;
};
