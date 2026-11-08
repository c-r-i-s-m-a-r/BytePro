module.exports = (sequelize, DataTypes) => {
  const Despacho = sequelize.define(
    'Despacho',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      ventaId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      codigoSeguimiento: { type: DataTypes.STRING(40), allowNull: true, unique: true },
      estado: {
        type: DataTypes.ENUM(
          'PEDIDO_CONFIRMADO',
          'PREPARANDO_PEDIDO',
          'EN_PREPARACION',
          'EN_CAMINO',
          'ENTREGADO',
          'CANCELADO',
          'pendiente',
          'preparando',
          'enviado',
          'entregado'
        ),
        allowNull: false,
        defaultValue: 'PEDIDO_CONFIRMADO',
      },
      nombreDestinatario: { type: DataTypes.STRING(160), allowNull: true },
      direccion: { type: DataTypes.STRING(255), allowNull: true },
      ciudad: { type: DataTypes.STRING(100), allowNull: true },
      telefono: { type: DataTypes.STRING(40), allowNull: true },
      notas: { type: DataTypes.STRING(500), allowNull: true },
      ubicacionActual: { type: DataTypes.STRING(160), allowNull: true },
      fechaEstimada: { type: DataTypes.DATE, allowNull: true },
      historial: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
      nota: { type: DataTypes.STRING(255), allowNull: true },
      trackingCode: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getDataValue('codigoSeguimiento');
        },
      },
      codigo: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getDataValue('codigoSeguimiento');
        },
      },
      numeroGuia: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getDataValue('codigoSeguimiento');
        },
      },
      destinatario: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getDataValue('nombreDestinatario');
        },
      },
      direccionExacta: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getDataValue('direccion');
        },
      },
    },
    {
      tableName: 'despachos',
      indexes: [
        { fields: ['venta_id'] },
        { fields: ['codigo_seguimiento'] },
      ],
    }
  );

  return Despacho;
};
