module.exports = (sequelize, DataTypes) => {
  const CarritoItem = sequelize.define(
    'CarritoItem',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      carritoId: { type: DataTypes.INTEGER, allowNull: false },
      varianteId: { type: DataTypes.INTEGER, allowNull: false },
      cantidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    },
    {
      tableName: 'carrito_items',
      indexes: [{ fields: ['carrito_id'] }, { fields: ['variante_id'] }],
    }
  );

  return CarritoItem;
};
