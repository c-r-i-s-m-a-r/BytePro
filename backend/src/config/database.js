const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const env = require('./env');

const storageDir = path.dirname(env.dbStorage);
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: env.dbStorage,
  logging: false,
  define: {
    underscored: true,
    timestamps: true,
  },
});

module.exports = sequelize;
