const AppError = require('../utils/AppError');

const STAFF_ROLES = ['admin', 'empleado', 'vendedor', 'soporte', 'operaciones'];
const ALMACEN_ROLES = ['admin', 'empleado', 'vendedor', 'operaciones'];

function getActiveFunction(user) {
  if (!user) return null;
  if (typeof user.getFuncionActivaEfectiva === 'function') {
    return user.getFuncionActivaEfectiva();
  }
  return user.funcionActiva || user.rol;
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Token de autenticación requerido', 401));
    }
    const funcionActiva = getActiveFunction(req.user);
    const userRole = req.user.rol;
    const allowed = roles.includes(userRole) || roles.includes(funcionActiva) || userRole === 'admin';
    if (!allowed) {
      return next(new AppError('Esta operación requiere la función activa correspondiente', 403));
    }
    return next();
  };
}

/**
 * REQ-EMP-01 / REQ-EMP-02:
 * Exige que la función actualmente activa del empleado (o admin) coincida con la requerida.
 * - 'vendedor': Exclusivo catálogo / productos
 * - 'soporte': Exclusivo reclamos y soporte
 * - 'operaciones': Exclusivo logística, envíos y almacén
 */
function requireActiveFunction(...allowedFunctions) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Token de autenticación requerido', 401));
    }

    // Admin tiene pase maestro
    if (req.user.rol === 'admin') {
      return next();
    }

    const funcionActiva = getActiveFunction(req.user);
    if (!allowedFunctions.includes(funcionActiva)) {
      return next(new AppError('Esta operación requiere la función activa correspondiente', 403));
    }

    return next();
  };
}

function requireProductManager(req, res, next) {
  if (!req.user) {
    return next(new AppError('Token de autenticación requerido', 401));
  }

  if (req.user.rol === 'admin') {
    return next();
  }

  const funcionActiva = getActiveFunction(req.user);
  if (!['vendedor', 'admin'].includes(funcionActiva)) {
    return next(
      new AppError('Esta operación requiere la función activa de Vendedor o Admin', 403)
    );
  }

  return next();
}

const requireStaff = requireRole(...STAFF_ROLES);
const requireAlmacen = requireRole(...ALMACEN_ROLES);

module.exports = {
  requireRole,
  requireStaff,
  requireAlmacen,
  requireActiveFunction,
  requireProductManager,
  getActiveFunction,
  STAFF_ROLES,
  ALMACEN_ROLES,
};
