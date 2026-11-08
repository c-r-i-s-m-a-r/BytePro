module.exports = (sequelize, DataTypes) => {
  const VentaItem = sequelize.define(
    'VentaItem',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      ventaId: { type: DataTypes.INTEGER, allowNull: false },
      varianteId: { type: DataTypes.INTEGER, allowNull: false },
      cantidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      precioUnitario: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    },
    {
      tableName: 'venta_items',
      indexes: [{ fields: ['venta_id'] }, { fields: ['variante_id'] }],
    }
  );

  return VentaItem;
};
