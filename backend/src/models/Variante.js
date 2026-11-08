module.exports = (sequelize, DataTypes) => {
  const Variante = sequelize.define(
    'Variante',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      productoId: { type: DataTypes.INTEGER, allowNull: false },
      sku: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      ean: { type: DataTypes.STRING(32), allowNull: true },
      nombre: { type: DataTypes.STRING(120), allowNull: true },
      atributos: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
      precioVenta: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
      precioCompra: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
      imagenes: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      tableName: 'variantes',
      indexes: [{ fields: ['producto_id'] }],
    }
  );

  return Variante;
};
