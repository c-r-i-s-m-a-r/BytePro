module.exports = (sequelize, DataTypes) => {
  const Transaccion = sequelize.define(
    'Transaccion',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      ventaId: { type: DataTypes.INTEGER, allowNull: false },
      checkoutId: { type: DataTypes.INTEGER, allowNull: true },
      usuarioId: { type: DataTypes.INTEGER, allowNull: false },
      codigoTransaccion: { type: DataTypes.STRING(80), allowNull: false, unique: true },
      idempotencyKey: { type: DataTypes.STRING(120), allowNull: false, unique: true },
      metodo: {
        type: DataTypes.ENUM('tarjeta', 'transferencia', 'pasarela'),
        allowNull: false,
      },
      proveedor: { type: DataTypes.STRING(40), allowNull: true },
      monto: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      moneda: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
      estado: {
        type: DataTypes.ENUM('pendiente', 'aprobado', 'rechazado', 'discrepancia'),
        allowNull: false,
        defaultValue: 'pendiente',
      },
      motivoRechazo: { type: DataTypes.STRING(255), allowNull: true },
      referenciaExterna: { type: DataTypes.STRING(120), allowNull: true },
      tokenPago: { type: DataTypes.STRING(160), allowNull: true },
      ultimos4: { type: DataTypes.STRING(4), allowNull: true },
      marcaTarjeta: { type: DataTypes.STRING(30), allowNull: true },
      montoPasarela: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
      payloadRespuesta: { type: DataTypes.JSON, allowNull: true },
      fechaProcesado: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'transacciones',
      indexes: [
        { fields: ['venta_id'] },
        { fields: ['checkout_id'] },
        { fields: ['estado'] },
      ],
    }
  );

  return Transaccion;
};
