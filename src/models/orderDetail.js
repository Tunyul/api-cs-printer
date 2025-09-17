// src/models/orderDetail.js
'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class OrderDetail extends Model {
    static associate(models) {
      // Relasi, silakan sesuaikan dengan skema kamu
  OrderDetail.belongsTo(models.Order,   { foreignKey: 'id_order' });
  OrderDetail.belongsTo(models.Product, { foreignKey: 'id_produk' });
    }
  }

  OrderDetail.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_produk: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    harga_satuan: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false
    },
    subtotal_item: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'OrderDetail',
    tableName: 'order_details',
    timestamps: true
  });

  return OrderDetail;
};
