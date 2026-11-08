const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const env = require('../config/env');

function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_RE.test(email.trim());
}

function validateRegistration({ nombre, email, password }) {
  const errors = [];
  if (!nombre || String(nombre).trim().length < 2) {
    errors.push({ field: 'nombre', message: 'El nombre es obligatorio' });
  }
  if (!isValidEmail(email)) {
    errors.push({ field: 'email', message: 'El correo electrónico no es válido' });
  }
  if (typeof password !== 'string' || password.length < env.passwordMinLength) {
    errors.push({
      field: 'password',
      message: `La contraseña debe tener al menos ${env.passwordMinLength} caracteres`,
    });
  }
  return errors;
}

module.exports = { isValidEmail, validateRegistration };
