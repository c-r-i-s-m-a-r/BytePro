module.exports = (sequelize, DataTypes) => {
  const Categoria = sequelize.define(
    'Categoria',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: DataTypes.STRING(80), allowNull: false, unique: true },
      slug: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      descripcion: { type: DataTypes.STRING(255), allowNull: true },
      parentId: { type: DataTypes.INTEGER, allowNull: true },
      atributos: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    { tableName: 'categorias' }
  );

  return Categoria;
};
