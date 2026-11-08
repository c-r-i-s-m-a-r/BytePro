const { Op } = require('sequelize');
const { Reclamo, Usuario } = require('../models');
const AppError = require('../utils/AppError');

const TIPOS_VALIDOS = [
  'CONSULTA_PRODUCTO',
  'PROBLEMA_ENVIO',
  'FALLA_HARDWARE',
  'GARANTIA_RECLAMO',
  'OTRO',
];

function validarEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validarCelular(celular) {
  if (!celular || typeof celular !== 'string') return false;
  const digits = celular.replace(/\D/g, '');
  return digits.length >= 7;
}

async function generarCodigoTicket() {
  const hoy = new Date();
  const ymd = `${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, '0')}${String(
    hoy.getDate()
  ).padStart(2, '0')}`;

  const countHoy = await Reclamo.count({
    where: {
      codigoTicket: { [Op.like]: `TKT-${ymd}-%` },
    },
  });

  const nextSeq = String(countHoy + 1).padStart(4, '0');
  const codigo = `TKT-${ymd}-${nextSeq}`;

  const exists = await Reclamo.findOne({ where: { codigoTicket: codigo } });
  if (exists) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `TKT-${ymd}-${randomSuffix}`;
  }
  return codigo;
}

async function crearReclamo({
  nombreContacto,
  email,
  celular,
  tipoSolicitud,
  numeroPedido,
  descripcion,
  usuario,
}) {
  const nombre = String(nombreContacto || '').trim();
  const desc = String(descripcion || '').trim();
  const mail = email ? String(email).trim() : null;
  const cel = celular ? String(celular).trim() : null;

  const errors = {};
  if (!nombre) {
    errors.nombreContacto = 'El nombre de contacto es obligatorio.';
  }

  const tieneMailValido = mail && validarEmail(mail);
  const tieneCelValido = cel && validarCelular(cel);

  if (!tieneMailValido && !tieneCelValido) {
    errors.contacto = 'Debes proporcionar al menos un medio de contacto válido (correo electrónico válido o número de celular de al menos 7 dígitos).';
  }

  if (!desc) {
    errors.descripcion = 'La descripción detallada del problema es obligatoria.';
  }

  const tipo = TIPOS_VALIDOS.includes(tipoSolicitud) ? tipoSolicitud : 'CONSULTA_PRODUCTO';

  if (Object.keys(errors).length > 0) {
    throw new AppError('Datos inválidos en la solicitud de ayuda o reclamo', 400, errors);
  }

  const codigoTicket = await generarCodigoTicket();

  const nuevo = await Reclamo.create({
    codigoTicket,
    nombreContacto: nombre,
    email: mail,
    celular: cel,
    tipoSolicitud: tipo,
    numeroPedido: numeroPedido ? String(numeroPedido).trim() : null,
    descripcion: desc,
    estado: 'PENDIENTE',
    usuarioId: usuario ? usuario.id : null,
  });

  return nuevo;
}

async function listarReclamos({ estado, asignadoA, limit = 50, page = 1 } = {}) {
  const where = {};
  if (estado) {
    where.estado = estado.toUpperCase();
  }
  if (asignadoA) {
    where.empleadoAsignadoId = asignadoA;
  }

  const parsedLimit = Math.max(1, Math.min(100, Number(limit) || 50));
  const parsedPage = Math.max(1, Number(page) || 1);
  const offset = (parsedPage - 1) * parsedLimit;

  const { rows, count } = await Reclamo.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: parsedLimit,
    offset,
    include: [
      { model: Usuario, as: 'usuario', attributes: ['id', 'username', 'nombre', 'email'] },
      { model: Usuario, as: 'empleadoAsignado', attributes: ['id', 'username', 'nombre', 'email'] },
    ],
  });

  return {
    items: rows,
    pagination: {
      total: count,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(count / parsedLimit),
    },
  };
}

async function obtenerReclamoPorIdOCodigo(idOrCodigo) {
  const where = isNaN(Number(idOrCodigo))
    ? { codigoTicket: idOrCodigo }
    : { [Op.or]: [{ id: Number(idOrCodigo) }, { codigoTicket: idOrCodigo }] };

  const item = await Reclamo.findOne({
    where,
    include: [
      { model: Usuario, as: 'usuario', attributes: ['id', 'username', 'nombre', 'email'] },
      { model: Usuario, as: 'empleadoAsignado', attributes: ['id', 'username', 'nombre', 'email'] },
    ],
  });

  if (!item) {
    throw new AppError('El ticket o solicitud de ayuda no fue encontrado', 404);
  }
  return item;
}

async function tomarCaso({ idOrCodigo, usuario }) {
  const item = await obtenerReclamoPorIdOCodigo(idOrCodigo);

  if (item.estado === 'RESUELTO') {
    throw new AppError('El caso ya fue resuelto y cerrado', 400);
  }

  // REQ-SOP-07: Si ya está asignado a otro empleado y el usuario no es admin
  const funcionActiva = usuario.getFuncionActivaEfectiva ? usuario.getFuncionActivaEfectiva() : usuario.rol;
  const esAdmin = usuario.rol === 'admin' || funcionActiva === 'admin';

  if (item.empleadoAsignadoId && item.empleadoAsignadoId !== usuario.id && !esAdmin) {
    throw new AppError('Este caso ya está tomado por otro agente de soporte', 403);
  }

  item.empleadoAsignadoId = usuario.id;
  item.estado = 'EN_ATENCION';
  item.fechaAtencion = item.fechaAtencion || new Date();
  await item.save();

  return obtenerReclamoPorIdOCodigo(item.id);
}

async function resolverCaso({ idOrCodigo, solucion, usuario }) {
  const item = await obtenerReclamoPorIdOCodigo(idOrCodigo);

  const funcionActiva = usuario.getFuncionActivaEfectiva ? usuario.getFuncionActivaEfectiva() : usuario.rol;
  const esAdmin = usuario.rol === 'admin' || funcionActiva === 'admin';

  if (item.empleadoAsignadoId && item.empleadoAsignadoId !== usuario.id && !esAdmin) {
    throw new AppError('Solo el agente asignado o un administrador puede resolver este caso', 403);
  }

  const sol = String(solucion || '').trim();
  if (!sol) {
    throw new AppError('Debes registrar las notas de resolución o contacto con el cliente', 400);
  }

  item.solucion = sol;
  item.estado = 'RESUELTO';
  item.fechaResolucion = new Date();
  if (!item.empleadoAsignadoId) {
    item.empleadoAsignadoId = usuario.id;
  }
  await item.save();

  return obtenerReclamoPorIdOCodigo(item.id);
}

module.exports = {
  crearReclamo,
  listarReclamos,
  obtenerReclamoPorIdOCodigo,
  tomarCaso,
  resolverCaso,
  TIPOS_VALIDOS,
};
