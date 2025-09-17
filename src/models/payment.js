// payment.js (model)
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    static associate(models) {
  Payment.belongsTo(models.Order, { foreignKey: 'no_transaksi', targetKey: 'no_transaksi' });
  Payment.belongsTo(models.Customer, { foreignKey: 'no_hp', targetKey: 'no_hp' });
    }
  }

  Payment.init({
    id_payment: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    no_transaksi: {
      type: DataTypes.STRING,
      allowNull: false
    },
    no_hp: {
      type: DataTypes.STRING,
      allowNull: false
    },
    nominal: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false
    },
    tanggal: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    bukti: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tipe: {
      type: DataTypes.ENUM('dp','pelunasan'),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Payment',
    tableName: 'payments',
    timestamps: false
  });

  return Payment;
};
