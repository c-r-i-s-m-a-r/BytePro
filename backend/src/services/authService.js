const crypto = require('crypto');
const { Op } = require('sequelize');
const { Usuario, Cliente } = require('../models');
const { hashPassword, verifyPassword } = require('../utils/hash');
const { signToken } = require('../utils/jwt');
const { validateRegistration } = require('../utils/validators');
const AppError = require('../utils/AppError');
const emailService = require('./emailService');
const env = require('../config/env');

const MENSAJE_RECUPERACION_GENERICO =
  'Si el correo corresponde a una cuenta de cliente registrada, recibirás un código temporal para restablecer tu contraseña.';
const MENSAJE_CODIGO_INVALIDO =
  'El código de recuperación es inválido o ha expirado. Solicita uno nuevo.';
const MINUTOS_VIGENCIA_CODIGO = 15;

const UMBRAL_INTENTOS_CLIENTE = 8;
const UMBRAL_INTENTOS_EMPLEADO = 5;
const ESPERAS_CLIENTE_MS = [
  30 * 1000,
  60 * 1000,
  5 * 60 * 1000,
  10 * 60 * 1000,
  60 * 60 * 1000,
  24 * 60 * 60 * 1000,
];
const ESPERAS_EMPLEADO_MS = [60 * 1000, 5 * 60 * 1000];

function esAdmin(usuario) {
  return usuario.rol === 'admin' || usuario.getRolesList().includes('admin');
}

function formatearEspera(ms) {
  const segundos = Math.max(1, Math.ceil(ms / 1000));
  if (segundos >= 86400) return '24 horas';
  if (segundos >= 3600) {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.ceil((segundos % 3600) / 60);
    return minutos > 0 ? `${horas} h ${minutos} min` : `${horas} h`;
  }
  if (segundos >= 60) {
    const minutos = Math.floor(segundos / 60);
    const resto = segundos % 60;
    return resto > 0 ? `${minutos} min ${resto} s` : `${minutos} min`;
  }
  return `${segundos} s`;
}

function errorPenalizacion(ms) {
  const segundosRestantes = Math.max(1, Math.ceil(ms / 1000));
  return new AppError(
    `Demasiados intentos fallidos. Intenta de nuevo en ${formatearEspera(ms)}.`,
    429,
    null,
    { segundosRestantes }
  );
}


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
    throw new AppError('Usuario o contraseña incorrecta', 401);
  }

  const usuario = await Usuario.findOne({
    where: { email: String(email).trim().toLowerCase() },
  });

  if (!usuario) {
    throw new AppError('Usuario o contraseña incorrecta', 401);
  }

  if (!usuario.activo) {
    throw new AppError(
      'Cuenta bloqueada por seguridad. Contacta al administrador para desbloquearla.',
      403
    );
  }

  const admin = esAdmin(usuario);

  // Penalización temporal activa: se rechaza sin verificar la contraseña.
  if (!admin && usuario.bloqueadoHasta) {
    const restante = new Date(usuario.bloqueadoHasta).getTime() - Date.now();
    if (restante > 0) {
      throw errorPenalizacion(restante);
    }
    usuario.bloqueadoHasta = null;
    await usuario.save();
  }

  const passwordOk = await verifyPassword(password, usuario.passwordHash);

  if (passwordOk) {
    if (usuario.intentosFallidos > 0 || usuario.bloqueadoHasta) {
      usuario.intentosFallidos = 0;
      usuario.bloqueadoHasta = null;
      await usuario.save();
    }
    const token = signToken({ sub: usuario.id, rol: usuario.rol });
    return { user: usuario.toSafeJSON(), token };
  }

  // Los administradores quedan exentos de la penalización automática.
  if (admin) {
    throw new AppError('Usuario o contraseña incorrecta', 401);
  }

  const umbral =
    usuario.rol === 'cliente' ? UMBRAL_INTENTOS_CLIENTE : UMBRAL_INTENTOS_EMPLEADO;
  const intentos = (usuario.intentosFallidos || 0) + 1;
  usuario.intentosFallidos = intentos;

  if (intentos % umbral === 0) {
    const ciclo = intentos / umbral;

    if (usuario.rol === 'cliente') {
      const espera =
        ESPERAS_CLIENTE_MS[Math.min(ciclo, ESPERAS_CLIENTE_MS.length) - 1];
      usuario.bloqueadoHasta = new Date(Date.now() + espera);
      await usuario.save();
      throw errorPenalizacion(espera);
    }

    if (ciclo >= 3) {
      // Tercer ciclo de empleado (15 fallos): bloqueo definitivo.
      usuario.activo = false;
      usuario.bloqueadoHasta = null;
      await usuario.save();
      throw new AppError(
        'Cuenta bloqueada por seguridad. Contacta al administrador para desbloquearla.',
        403
      );
    }

    const espera = ESPERAS_EMPLEADO_MS[ciclo - 1];
    usuario.bloqueadoHasta = new Date(Date.now() + espera);
    await usuario.save();
    throw errorPenalizacion(espera);
  }

  await usuario.save();
  throw new AppError('Usuario o contraseña incorrecta', 401);
}

async function findById(id) {
  const usuario = await Usuario.findByPk(id);
  if (!usuario) throw new AppError('Usuario no encontrado', 404);
  return usuario;
}

function hashearCodigo(codigo) {
  return crypto.createHash('sha256').update(String(codigo)).digest('hex');
}

function compararHashes(a, b) {
  const bufferA = Buffer.from(String(a || ''), 'utf8');
  const bufferB = Buffer.from(String(b || ''), 'utf8');
  if (bufferA.length !== bufferB.length) return false;
  return crypto.timingSafeEqual(bufferA, bufferB);
}

/**
 * REQ-EML-01: solicitud de código exclusiva para clientes. La respuesta es
 * siempre genérica para impedir la enumeración de cuentas.
 */
async function solicitarRecuperacionPassword(email) {
  const generico = { ok: true, mensaje: MENSAJE_RECUPERACION_GENERICO };
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) return generico;

  const usuario = await Usuario.findOne({ where: { email: normalizedEmail } });
  if (!usuario || usuario.rol !== 'cliente') return generico;

  const codigo = crypto.randomInt(100000, 999999).toString();
  usuario.resetPasswordToken = hashearCodigo(codigo);
  usuario.resetPasswordExpires = new Date(
    Date.now() + MINUTOS_VIGENCIA_CODIGO * 60 * 1000
  );
  await usuario.save();

  try {
    await emailService.enviarCodigoRecuperacion({
      usuario,
      codigo,
      expiraMinutos: MINUTOS_VIGENCIA_CODIGO,
    });
  } catch (err) {
    console.warn(`[email] No se pudo enviar el código de recuperación: ${err.message}`);
  }

  return generico;
}

/**
 * REQ-EML-02: validación del código temporal y actualización segura de la
 * contraseña, limpiando la penalización por intentos fallidos.
 */
async function restablecerPasswordConCodigo({ email, codigo, nuevoPassword }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const codigoLimpio = String(codigo || '').trim();

  if (!nuevoPassword || String(nuevoPassword).length < env.passwordMinLength) {
    throw new AppError(
      `La nueva contraseña debe tener al menos ${env.passwordMinLength} caracteres`,
      400
    );
  }

  if (!normalizedEmail || !codigoLimpio) {
    throw new AppError(MENSAJE_CODIGO_INVALIDO, 400);
  }

  const usuario = await Usuario.findOne({ where: { email: normalizedEmail } });
  if (!usuario || usuario.rol !== 'cliente') {
    throw new AppError(MENSAJE_CODIGO_INVALIDO, 400);
  }

  if (!usuario.resetPasswordToken || !usuario.resetPasswordExpires) {
    throw new AppError(MENSAJE_CODIGO_INVALIDO, 400);
  }

  const expira = new Date(usuario.resetPasswordExpires).getTime();
  if (!Number.isFinite(expira) || expira <= Date.now()) {
    throw new AppError(MENSAJE_CODIGO_INVALIDO, 400);
  }

  if (!compararHashes(hashearCodigo(codigoLimpio), usuario.resetPasswordToken)) {
    throw new AppError(MENSAJE_CODIGO_INVALIDO, 400);
  }

  usuario.passwordHash = await hashPassword(String(nuevoPassword));
  usuario.resetPasswordToken = null;
  usuario.resetPasswordExpires = null;
  usuario.intentosFallidos = 0;
  usuario.bloqueadoHasta = null;
  await usuario.save();

  return {
    ok: true,
    mensaje: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.',
  };
}

module.exports = {
  register,
  login,
  findById,
  solicitarRecuperacionPassword,
  restablecerPasswordConCodigo,
};
