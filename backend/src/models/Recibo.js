module.exports = (sequelize, DataTypes) => {
  const Recibo = sequelize.define(
    'Recibo',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      ventaId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      transaccionId: { type: DataTypes.INTEGER, allowNull: true, unique: true },
      numero: { type: DataTypes.STRING(40), allowNull: false, unique: true },
      subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      descuentoRetiro: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      descuentoPorcentaje: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
      impuestos: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      total: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      moneda: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'BOB' },
      metodo: { type: DataTypes.STRING(40), allowNull: true },
      codigoTransaccion: { type: DataTypes.STRING(80), allowNull: true },
      clienteNombre: { type: DataTypes.STRING(120), allowNull: true },
      clienteEmail: { type: DataTypes.STRING(160), allowNull: true },
      metodoEntrega: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'domicilio',
      },
      sucursalNombre: { type: DataTypes.STRING(120), allowNull: true },
      sucursalCiudad: { type: DataTypes.STRING(100), allowNull: true },
      sucursalDireccion: { type: DataTypes.STRING(255), allowNull: true },
      sucursalTelefono: { type: DataTypes.STRING(40), allowNull: true },
      sucursalHorarios: { type: DataTypes.STRING(255), allowNull: true },
      items: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      enviadoEn: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'recibos',
      indexes: [{ fields: ['venta_id'] }],
    }
  );

  return Recibo;
};
