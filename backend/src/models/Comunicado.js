module.exports = (sequelize, DataTypes) => {
  const Comunicado = sequelize.define(
    'Comunicado',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      titulo: { type: DataTypes.STRING(160), allowNull: false },
      contenido: { type: DataTypes.TEXT, allowNull: false },
      prioridad: {
        type: DataTypes.ENUM('Informativo', 'Importante', 'Urgente'),
        allowNull: false,
        defaultValue: 'Informativo',
      },
      autorId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: 'comunicados',
      indexes: [{ fields: ['autor_id'] }, { fields: ['prioridad'] }],
    }
  );

  return Comunicado;
};
