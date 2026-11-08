module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define(
    'Usuario',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      username: { type: DataTypes.STRING(60), allowNull: false, unique: true },
      email: { type: DataTypes.STRING(160), allowNull: false, unique: true },
      passwordHash: { type: DataTypes.STRING(255), allowNull: false },
      nombre: { type: DataTypes.STRING(120), allowNull: false },
      telefono: { type: DataTypes.STRING(40), allowNull: true },
      rol: {
        type: DataTypes.ENUM('cliente', 'empleado', 'vendedor', 'soporte', 'operaciones', 'admin'),
        allowNull: false,
        defaultValue: 'cliente',
      },
      roles: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      funcionActiva: {
        type: DataTypes.STRING(40),
        allowNull: true,
      },
      activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      tableName: 'usuarios',
      indexes: [{ fields: ['rol'] }],
    }
  );

  Usuario.prototype.getRolesList = function getRolesList() {
    if (this.roles) {
      try {
        const parsed = typeof this.roles === 'string' ? JSON.parse(this.roles) : this.roles;
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        // fall back to string split or rol
        const list = String(this.roles)
          .split(',')
          .map((r) => r.trim())
          .filter(Boolean);
        if (list.length > 0) return list;
      }
    }
    return [this.rol];
  };

  Usuario.prototype.getFuncionActivaEfectiva = function getFuncionActivaEfectiva() {
    const roles = this.getRolesList();
    if (this.funcionActiva && (roles.includes(this.funcionActiva) || this.rol === 'admin')) {
      return this.funcionActiva;
    }
    return roles[0] || this.rol;
  };

  Usuario.prototype.toSafeJSON = function toSafeJSON() {
    const roles = this.getRolesList();
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      nombre: this.nombre,
      telefono: this.telefono,
      rol: this.rol,
      roles,
      funcionActiva: this.getFuncionActivaEfectiva(),
    };
  };

  return Usuario;
};
