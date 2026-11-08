module.exports = (sequelize, DataTypes) => {
  const EventoAuditoria = sequelize.define(
    'EventoAuditoria',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tipo: { type: DataTypes.STRING(60), allowNull: false },
      severidad: {
        type: DataTypes.ENUM('info', 'advertencia', 'critica'),
        allowNull: false,
        defaultValue: 'info',
      },
      mensaje: { type: DataTypes.STRING(255), allowNull: false },
      ventaId: { type: DataTypes.INTEGER, allowNull: true },
      transaccionId: { type: DataTypes.INTEGER, allowNull: true },
      usuarioId: { type: DataTypes.INTEGER, allowNull: true },
      payload: { type: DataTypes.JSON, allowNull: true },
    },
    {
      tableName: 'eventos_auditoria',
      indexes: [
        { fields: ['severidad'] },
        { fields: ['venta_id'] },
        { fields: ['transaccion_id'] },
      ],
    }
  );

  return EventoAuditoria;
};
