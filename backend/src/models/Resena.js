module.exports = (sequelize, DataTypes) => {
  const Resena = sequelize.define(
    'Resena',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      productoId: { type: DataTypes.INTEGER, allowNull: false },
      usuarioId: { type: DataTypes.INTEGER, allowNull: false },
      calificacion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1, max: 5 },
      },
      comentario: { type: DataTypes.TEXT, allowNull: false },
      compraVerificada: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    {
      tableName: 'resenas',
      indexes: [{ fields: ['producto_id'] }],
    }
  );

  return Resena;
};
