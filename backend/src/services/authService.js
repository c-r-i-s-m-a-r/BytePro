const { Op } = require('sequelize');
const { Usuario, Cliente } = require('../models');
const { hashPassword, verifyPassword } = require('../utils/hash');
const { signToken } = require('../utils/jwt');
const { validateRegistration } = require('../utils/validators');
const AppError = require('../utils/AppError');

async function buildUniqueUsername(email) {
  const base = String(email)
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 40) || 'usuario';

  let candidate = base;
  let counter = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await Usuario.findOne({ where: { username: candidate } })) {
    candidate = `${base}${counter}`;
    counter += 1;
  }
  return candidate;
}

async function register({ nombre, email, password, telefono }) {
  const errors = validateRegistration({ nombre, email, password });
  if (errors.length) {
    throw new AppError('Datos inválidos', 400, errors);
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = await Usuario.findOne({ where: { email: normalizedEmail } });
  if (existing) {
    throw new AppError('El correo electrónico ya está en uso', 409);
  }

  const passwordHash = await hashPassword(password);
  const username = await buildUniqueUsername(normalizedEmail);

  const usuario = await Usuario.create({
    username,
    email: normalizedEmail,
    passwordHash,
    nombre: String(nombre).trim(),
    telefono: telefono ? String(telefono).trim() : null,
    rol: 'cliente',
  });

  await Cliente.create({ usuarioId: usuario.id });

  const token = signToken({ sub: usuario.id, rol: usuario.rol });
  return { user: usuario.toSafeJSON(), token };
}

async function login({ email, password }) {
  if (!email || !password) {
    throw new AppError('Credenciales incorrectas', 401);
  }

  const usuario = await Usuario.findOne({
    where: { email: String(email).trim().toLowerCase() },
  });

  if (!usuario || !usuario.activo) {
    throw new AppError('Credenciales incorrectas', 401);
  }

  const passwordOk = await verifyPassword(password, usuario.passwordHash);
  if (!passwordOk) {
    throw new AppError('Credenciales incorrectas', 401);
  }

  const token = signToken({ sub: usuario.id, rol: usuario.rol });
  return { user: usuario.toSafeJSON(), token };
}

async function findById(id) {
  const usuario = await Usuario.findByPk(id);
  if (!usuario) throw new AppError('Usuario no encontrado', 404);
  return usuario;
}

module.exports = { register, login, findById };
