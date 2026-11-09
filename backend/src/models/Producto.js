module.exports = (sequelize, DataTypes) => {
  const Producto = sequelize.define(
    'Producto',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: DataTypes.STRING(160), allowNull: false },
      marca: { type: DataTypes.STRING(80), allowNull: false },
      modelo: { type: DataTypes.STRING(120), allowNull: true },
      slug: { type: DataTypes.STRING(180), allowNull: false, unique: true },
      descripcion: { type: DataTypes.TEXT, allowNull: true },
      categoriaId: { type: DataTypes.INTEGER, allowNull: true },
      precioCompra: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      precioVenta: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      garantiaMeses: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 12 },
      especificaciones: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
      imagenes: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      imagenPrincipal: { type: DataTypes.TEXT, allowNull: true },
      activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      puntajePromedio: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      totalResenas: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    {
      tableName: 'productos',
      indexes: [{ fields: ['categoria_id'] }, { fields: ['marca'] }, { fields: ['activo'] }],
    }
  );

  return Producto;
};
