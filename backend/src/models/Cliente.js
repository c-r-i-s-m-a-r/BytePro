module.exports = (sequelize, DataTypes) => {
  const Cliente = sequelize.define(
    'Cliente',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      usuarioId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      direccion: { type: DataTypes.STRING(255), allowNull: true },
    },
    { tableName: 'clientes' }
  );

  return Cliente;
};
