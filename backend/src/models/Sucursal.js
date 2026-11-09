module.exports = (sequelize, DataTypes) => {
  const Sucursal = sequelize.define(
    'Sucursal',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: DataTypes.STRING(120), allowNull: false },
      ciudad: { type: DataTypes.STRING(100), allowNull: false },
      direccion: { type: DataTypes.STRING(255), allowNull: false },
      telefono: { type: DataTypes.STRING(40), allowNull: false },
      horarios: { type: DataTypes.STRING(255), allowNull: false },
      activa: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      tableName: 'sucursales',
      indexes: [{ fields: ['activa'] }, { fields: ['ciudad'] }],
    }
  );

  return Sucursal;
};
