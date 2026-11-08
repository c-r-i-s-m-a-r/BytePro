module.exports = (sequelize, DataTypes) => {
  const Carrito = sequelize.define(
    'Carrito',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      usuarioId: { type: DataTypes.INTEGER, allowNull: true },
      sessionId: { type: DataTypes.STRING(80), allowNull: true },
      estado: {
        type: DataTypes.ENUM('activo', 'convertido', 'abandonado'),
        allowNull: false,
        defaultValue: 'activo',
      },
    },
    {
      tableName: 'carritos',
      indexes: [{ fields: ['usuario_id'] }, { fields: ['session_id'] }],
    }
  );

  return Carrito;
};
