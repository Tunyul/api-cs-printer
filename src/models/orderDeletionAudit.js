"use strict";

module.exports = (sequelize, DataTypes) => {
  const OrderDeletionAudit = sequelize.define('OrderDeletionAudit', {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    id_order: DataTypes.INTEGER,
    deleted_by: DataTypes.STRING,
    reason: DataTypes.TEXT,
    snapshot_json: DataTypes.TEXT,
    created_at: DataTypes.DATE
  }, {
    tableName: 'order_deletion_audits',
    timestamps: false
  });

  return OrderDeletionAudit;
};
