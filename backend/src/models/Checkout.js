module.exports = (sequelize, DataTypes) => {
  const Checkout = sequelize.define(
    'Checkout',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      usuarioId: { type: DataTypes.INTEGER, allowNull: false },
      carritoId: { type: DataTypes.INTEGER, allowNull: false },
      ventaId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      descuentoRetiro: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      descuentoPorcentaje: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
      impuestos: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      total: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      moneda: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'BOB' },
      estado: {
        type: DataTypes.ENUM('abierto', 'pagado', 'fallido', 'expirado'),
        allowNull: false,
        defaultValue: 'abierto',
      },
      expiraEn: { type: DataTypes.DATE, allowNull: false },
      ultimoIntentoEn: { type: DataTypes.DATE, allowNull: true },
      nombreDestinatario: { type: DataTypes.STRING(160), allowNull: true },
      direccion: { type: DataTypes.STRING(255), allowNull: true },
      ciudad: { type: DataTypes.STRING(100), allowNull: true },
      telefono: { type: DataTypes.STRING(40), allowNull: true },
      notas: { type: DataTypes.STRING(500), allowNull: true },
      metodoEntrega: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'domicilio',
      },
      sucursalId: { type: DataTypes.INTEGER, allowNull: true },
      sucursalNombre: { type: DataTypes.STRING(120), allowNull: true },
      sucursalCiudad: { type: DataTypes.STRING(100), allowNull: true },
      sucursalDireccion: { type: DataTypes.STRING(255), allowNull: true },
      sucursalTelefono: { type: DataTypes.STRING(40), allowNull: true },
      sucursalHorarios: { type: DataTypes.STRING(255), allowNull: true },
    },
    {
      tableName: 'checkouts',
      indexes: [
        { fields: ['usuario_id'] },
        { fields: ['carrito_id'] },
        { fields: ['venta_id'] },
      ],
    }
  );

  return Checkout;
};
