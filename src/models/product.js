'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      // define association here
    }
  }

  Product.init({
    id_produk: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    kategori: {
      type: DataTypes.STRING,
      allowNull: false
    },
    nama_produk: {
      type: DataTypes.STRING,
      allowNull: false
    },
    bahan: {
      type: DataTypes.STRING,
      allowNull: true
    },
    finishing: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ukuran_standar: {
      // repurposed: store pricing unit marker. values: 'pcs' or 'm'
      type: DataTypes.ENUM('pcs', 'm'),
      allowNull: true,
      defaultValue: 'pcs'
    },
    harga_per_m2: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true
    },
    unit_area: {
      // area per piece in m2 (optional). Backfilled by migration when ukuran_standar was a size string.
      type: DataTypes.DECIMAL(10,2),
      allowNull: true
    },
    harga_per_pcs: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true
    },
    waktu_proses: {
      type: DataTypes.STRING,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    timestamps: false
  });

  return Product;
};