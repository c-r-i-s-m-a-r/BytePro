module.exports = (sequelize, DataTypes) => {
  const BloqueoStock = sequelize.define(
    'BloqueoStock',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      checkoutId: { type: DataTypes.INTEGER, allowNull: false },
      varianteId: { type: DataTypes.INTEGER, allowNull: false },
      cantidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      expiraEn: { type: DataTypes.DATE, allowNull: false },
      estado: {
        type: DataTypes.ENUM('activo', 'liberado', 'consumido', 'expirado'),
        allowNull: false,
        defaultValue: 'activo',
      },
    },
    {
      tableName: 'bloqueos_stock',
      indexes: [
        { fields: ['checkout_id'] },
        { fields: ['variante_id'] },
        { fields: ['estado'] },
      ],
    }
  );

  return BloqueoStock;
};
