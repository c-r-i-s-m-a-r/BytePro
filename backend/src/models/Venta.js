module.exports = (sequelize, DataTypes) => {
  const Venta = sequelize.define(
    'Venta',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      usuarioId: { type: DataTypes.INTEGER, allowNull: false },
      total: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      estado: {
        type: DataTypes.ENUM(
          'pendiente',
          'pagada',
          'enviada',
          'entregada',
          'cancelada',
          'CANCELADO'
        ),
        allowNull: false,
        defaultValue: 'pendiente',
      },
    },
    {
      tableName: 'ventas',
      indexes: [{ fields: ['usuario_id'] }],
    }
  );

  return Venta;
};
