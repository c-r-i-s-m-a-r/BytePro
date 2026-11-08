module.exports = (sequelize, DataTypes) => {
  const Direccion = sequelize.define(
    'Direccion',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      usuarioId: { type: DataTypes.INTEGER, allowNull: false },
      etiqueta: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'Casa' },
      nombreDestinatario: { type: DataTypes.STRING(160), allowNull: false },
      calle: { type: DataTypes.STRING(255), allowNull: false },
      ciudad: { type: DataTypes.STRING(100), allowNull: false },
      telefono: { type: DataTypes.STRING(40), allowNull: false },
      referencias: { type: DataTypes.STRING(500), allowNull: true },
      predeterminada: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      alias: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getDataValue('etiqueta');
        },
      },
      destinatario: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getDataValue('nombreDestinatario');
        },
      },
      direccion: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getDataValue('calle');
        },
      },
      notas: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getDataValue('referencias');
        },
      },
    },
    {
      tableName: 'direcciones',
      indexes: [{ fields: ['usuario_id'] }],
    }
  );

  return Direccion;
};
