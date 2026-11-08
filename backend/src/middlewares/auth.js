const AppError = require('../utils/AppError');
const { verifyToken } = require('../utils/jwt');
const { Usuario } = require('../models');

function extractToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

async function resolveUser(token) {
  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    throw new AppError('Token inválido o expirado', 401);
  }
  const user = await Usuario.findByPk(payload.sub);
  if (!user || !user.activo) {
    throw new AppError('Sesión no válida', 401);
  }
  return user;
}

async function authenticate(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) throw new AppError('Token de autenticación requerido', 401);
    req.user = await resolveUser(token);
    next();
  } catch (err) {
    next(err);
  }
}

async function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      req.user = null;
      return next();
    }
    req.user = await resolveUser(token);
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { authenticate, optionalAuth };
