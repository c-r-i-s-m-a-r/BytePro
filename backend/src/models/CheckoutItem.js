module.exports = (sequelize, DataTypes) => {
  const CheckoutItem = sequelize.define(
    'CheckoutItem',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      checkoutId: { type: DataTypes.INTEGER, allowNull: false },
      varianteId: { type: DataTypes.INTEGER, allowNull: false },
      cantidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      precioUnitario: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      nombreProducto: { type: DataTypes.STRING(160), allowNull: true },
      nombreVariante: { type: DataTypes.STRING(120), allowNull: true },
      sku: { type: DataTypes.STRING(64), allowNull: true },
    },
    {
      tableName: 'checkout_items',
      indexes: [{ fields: ['checkout_id'] }, { fields: ['variante_id'] }],
    }
  );

  return CheckoutItem;
};
