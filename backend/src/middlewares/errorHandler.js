const AppError = require('../utils/AppError');

function notFound(req, res, next) {
  next(new AppError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`, 404));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Error interno del servidor';
  let details = err.details || null;

  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    details = err.errors.map((e) => ({ field: e.path, message: e.message }));
    message = 'Datos inválidos';
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    const field = err.errors?.[0]?.path;
    message =
      field === 'email'
        ? 'El correo electrónico ya está en uso'
        : 'El recurso ya existe';
  }

  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error('[error]', err);
  }

  res.status(statusCode).json({
    error: {
      message,
      ...(details ? { details } : {}),
    },
  });
}

module.exports = { notFound, errorHandler };
