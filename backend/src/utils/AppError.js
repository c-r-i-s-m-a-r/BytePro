class AppError extends Error {
  constructor(message, statusCode = 500, details = null, extra = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    this.extra = extra;
    this.isOperational = true;
  }
}

module.exports = AppError;
