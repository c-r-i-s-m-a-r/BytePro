module.exports = (sequelize, DataTypes) => {
  const Reclamo = sequelize.define(
    'Reclamo',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      codigoTicket: { type: DataTypes.STRING(40), allowNull: false, unique: true },
      nombreContacto: { type: DataTypes.STRING(160), allowNull: false },
      email: { type: DataTypes.STRING(160), allowNull: true },
      celular: { type: DataTypes.STRING(40), allowNull: true },
      tipoSolicitud: {
        type: DataTypes.ENUM(
          'CONSULTA_PRODUCTO',
          'PROBLEMA_ENVIO',
          'FALLA_HARDWARE',
          'GARANTIA_RECLAMO',
          'OTRO'
        ),
        allowNull: false,
        defaultValue: 'CONSULTA_PRODUCTO',
      },
      numeroPedido: { type: DataTypes.STRING(60), allowNull: true },
      descripcion: { type: DataTypes.TEXT, allowNull: false },
      estado: {
        type: DataTypes.ENUM('PENDIENTE', 'EN_ATENCION', 'RESUELTO'),
        allowNull: false,
        defaultValue: 'PENDIENTE',
      },
      usuarioId: { type: DataTypes.INTEGER, allowNull: true },
      empleadoAsignadoId: { type: DataTypes.INTEGER, allowNull: true },
      solucion: { type: DataTypes.TEXT, allowNull: true },
      fechaAtencion: { type: DataTypes.DATE, allowNull: true },
      fechaResolucion: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'reclamos',
      indexes: [
        { fields: ['codigo_ticket'] },
        { fields: ['estado'] },
        { fields: ['usuario_id'] },
        { fields: ['empleado_asignado_id'] },
      ],
    }
  );

  return Reclamo;
};
