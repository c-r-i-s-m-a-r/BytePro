module.exports = (sequelize, DataTypes) => {
  const Kardex = sequelize.define(
    'Kardex',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      varianteId: { type: DataTypes.INTEGER, allowNull: false },
      tipo: {
        type: DataTypes.ENUM(
          'ENTRADA',
          'SALIDA',
          'SALIDA_VENTA',
          'AJUSTE',
          'RESERVA_VENTA',
          'LIBERACION_VENTA'
        ),
        allowNull: false,
      },
      cantidad: { type: DataTypes.INTEGER, allowNull: false },
      stockAnterior: { type: DataTypes.INTEGER, allowNull: false },
      stockResultante: { type: DataTypes.INTEGER, allowNull: false },
      motivo: { type: DataTypes.STRING(255), allowNull: true },
      usuarioId: { type: DataTypes.INTEGER, allowNull: true },
      ventaId: { type: DataTypes.INTEGER, allowNull: true },
      checkoutId: { type: DataTypes.INTEGER, allowNull: true },
      referencia: { type: DataTypes.STRING(120), allowNull: true },
    },
    {
      tableName: 'kardex',
      indexes: [
        { fields: ['variante_id'] },
        { fields: ['tipo'] },
        { fields: ['created_at'] },
      ],
    }
  );

  return Kardex;
};
