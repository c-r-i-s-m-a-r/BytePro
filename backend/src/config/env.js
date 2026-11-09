require('dotenv').config();
const path = require('path');

const backendRoot = path.join(__dirname, '..', '..');

function resolveStorage(value) {
  const raw = value || path.join(backendRoot, 'data', 'bytepro.sqlite');
  return path.isAbsolute(raw) ? raw : path.resolve(backendRoot, raw);
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  jwtSecret: process.env.JWT_SECRET || 'bytepro-dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
  dbStorage: resolveStorage(process.env.DB_STORAGE),
  pageSizeDefault: parseInt(process.env.PAGE_SIZE_DEFAULT || '12', 10),
  pageSizeMax: parseInt(process.env.PAGE_SIZE_MAX || '24', 10),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
  taxRate: parseFloat(process.env.TAX_RATE || '0.13'),
  currency: process.env.CURRENCY || 'BOB',
  stockLockMinutes: parseInt(process.env.STOCK_LOCK_MINUTES || '10', 10),
};
