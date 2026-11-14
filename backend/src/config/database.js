const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const env = require('./env');

const define = {
  underscored: true,
  timestamps: true,
};

function esConexionLocal(databaseUrl) {
  try {
    const { hostname } = new URL(databaseUrl);
    return ['localhost', '127.0.0.1', '::1'].includes(hostname);
  } catch (err) {
    return false;
  }
}

// REQ-SUP-01: SQLite temporal explícito para pruebas aisladas.
const forzandoSqliteDeTest = env.nodeEnv === 'test' && Boolean(process.env.DB_STORAGE);
const usarPostgres = Boolean(env.databaseUrl) && !forzandoSqliteDeTest;

let sequelize;

if (usarPostgres) {
  const dialectOptions =
    env.dbSsl && !esConexionLocal(env.databaseUrl)
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {};

  sequelize = new Sequelize(env.databaseUrl, {
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions,
    define,
  });
} else {
  const storageDir = path.dirname(env.dbStorage);
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: env.dbStorage,
    logging: false,
    define,
  });
}

module.exports = sequelize;
