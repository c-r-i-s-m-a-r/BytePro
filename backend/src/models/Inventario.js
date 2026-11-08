module.exports = (sequelize, DataTypes) => {
  const Inventario = sequelize.define(
    'Inventario',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      varianteId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      cantidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      ubicacion: { type: DataTypes.STRING(120), allowNull: true },
      umbralBajo: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },
    },
    { tableName: 'inventarios' }
  );

  return Inventario;
};
