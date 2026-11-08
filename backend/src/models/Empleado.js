module.exports = (sequelize, DataTypes) => {
  const Empleado = sequelize.define(
    'Empleado',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      usuarioId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      ci: { type: DataTypes.STRING(40), allowNull: true },
      puesto: { type: DataTypes.STRING(80), allowNull: true },
    },
    { tableName: 'empleados' }
  );

  return Empleado;
};
