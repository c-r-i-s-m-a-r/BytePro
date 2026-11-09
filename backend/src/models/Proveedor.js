module.exports = (sequelize, DataTypes) => {
  const Proveedor = sequelize.define(
    'Proveedor',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: DataTypes.STRING(160), allowNull: false },
      direccion: { type: DataTypes.STRING(255), allowNull: false },
      telefono: { type: DataTypes.STRING(40), allowNull: false },
      correo: { type: DataTypes.STRING(160), allowNull: false },
      activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      tableName: 'proveedores',
      indexes: [{ fields: ['activo'] }],
    }
  );

  return Proveedor;
};
