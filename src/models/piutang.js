'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Piutang extends Model {
    static associate(models) {
      Piutang.belongsTo(models.Customer, { foreignKey: 'id_customer' });
      Piutang.belongsTo(models.Order, { foreignKey: 'id_order' });
    }
  }

  Piutang.init({
    id_piutang: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_customer: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    jumlah_piutang: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    paid: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false,
      defaultValue: 0.00
    },
    tanggal_piutang: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('belum_lunas','lunas','terlambat'),
      allowNull: true,
      defaultValue: 'belum_lunas'
    },
    keterangan: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    id_order: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Piutang',
    tableName: 'piutang',
    timestamps: false
  });

  return Piutang;
};