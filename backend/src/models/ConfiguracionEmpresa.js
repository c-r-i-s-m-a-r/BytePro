module.exports = (sequelize, DataTypes) => {
  const ConfiguracionEmpresa = sequelize.define(
    'ConfiguracionEmpresa',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      descuentoRetiroAlto: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 7,
      },
      descuentoRetiroBajo: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 5,
      },
      umbralDescuentoRetiro: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 500,
      },
      moneda: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'BOB' },
    },
    { tableName: 'configuracion_empresa' }
  );

  return ConfiguracionEmpresa;
};
