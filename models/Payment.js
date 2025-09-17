'use strict';

module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
    id_payment: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
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
      type: DataTypes.ENUM('dp', 'pelunasan'),
      allowNull: false
    },
    no_transaksi: {
      type: DataTypes.STRING,
      allowNull: false
    },
    no_hp: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'payments',
    timestamps: false
  });

  Payment.associate = function(models) {
    Payment.belongsTo(models.Order, { foreignKey: 'id_order' });
  };

  return Payment;
};
