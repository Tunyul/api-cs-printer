'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PaymentAllocation extends Model {
    static associate(models) {
      PaymentAllocation.belongsTo(models.Payment, { foreignKey: 'id_payment' });
      PaymentAllocation.belongsTo(models.Piutang, { foreignKey: 'id_piutang' });
    }
  }

  PaymentAllocation.init({
    id_alloc: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    id_payment: { type: DataTypes.INTEGER, allowNull: false },
    id_piutang: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.DECIMAL(15,2), allowNull: false, defaultValue: 0.00 },
    tanggal_alloc: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
    note: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') }
  }, {
    sequelize,
    modelName: 'PaymentAllocation',
    tableName: 'payment_allocations',
    timestamps: false
  });

  return PaymentAllocation;
};
