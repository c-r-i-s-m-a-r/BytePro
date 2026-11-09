const {
  ConfiguracionEmpresa,
  Sucursal,
  Comunicado,
  Usuario,
} = require('../models');
const AppError = require('../utils/AppError');
const { round2 } = require('../utils/money');

const PRIORIDADES = ['Informativo', 'Importante', 'Urgente'];

const CONFIG_DEFAULT = {
  descuentoRetiroAlto: 7,
  descuentoRetiroBajo: 5,
  umbralDescuentoRetiro: 500,
  moneda: 'BOB',
};

function serializarConfiguracion(config) {
  if (!config) {
    return {
      id: 1,
      ...CONFIG_DEFAULT,
      descuentoRetiroAlto: 7,
      descuentoRetiroBajo: 5,
      umbralDescuentoRetiro: 500,
    };
  }
  return {
    id: config.id,
    descuentoRetiroAlto: Number(config.descuentoRetiroAlto),
    descuentoRetiroBajo: Number(config.descuentoRetiroBajo),
    umbralDescuentoRetiro: Number(config.umbralDescuentoRetiro),
    moneda: config.moneda || 'BOB',
  };
}

async function obtenerConfiguracion() {
  const [config] = await ConfiguracionEmpresa.findOrCreate({
    where: { id: 1 },
    defaults: CONFIG_DEFAULT,
  });
  return serializarConfiguracion(config);
}

function validarPorcentaje(valor, campo) {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero < 0 || numero > 100) {
    throw new AppError(`${campo} debe ser un porcentaje entre 0 y 100`, 400, [
      { field: campo, message: 'Valor porcentual inválido' },
    ]);
  }
  return round2(numero);
}

async function actualizarConfiguracion(payload = {}) {
  const config = await ConfiguracionEmpresa.findOne({ where: { id: 1 } });

  const actual = serializarConfiguracion(config);

  const descuentoRetiroAlto =
    payload.descuentoRetiroAlto !== undefined
      ? validarPorcentaje(payload.descuentoRetiroAlto, 'descuentoRetiroAlto')
      : actual.descuentoRetiroAlto;
  const descuentoRetiroBajo =
    payload.descuentoRetiroBajo !== undefined
      ? validarPorcentaje(payload.descuentoRetiroBajo, 'descuentoRetiroBajo')
      : actual.descuentoRetiroBajo;

  let umbral = actual.umbralDescuentoRetiro;
  if (payload.umbralDescuentoRetiro !== undefined) {
    umbral = Number(payload.umbralDescuentoRetiro);
    if (!Number.isFinite(umbral) || umbral < 0) {
      throw new AppError('El umbral de descuento debe ser un monto mayor o igual a 0', 400, [
        { field: 'umbralDescuentoRetiro', message: 'Monto inválido' },
      ]);
    }
    umbral = round2(umbral);
  }

  if (descuentoRetiroAlto < descuentoRetiroBajo) {
    throw new AppError(
      'El porcentaje para compras sobre el umbral no puede ser menor que el porcentaje base',
      400,
      [
        {
          field: 'descuentoRetiroAlto',
          message: 'El descuento alto debe ser mayor o igual al descuento bajo',
        },
      ]
    );
  }

  if (config) {
    await config.update({
      descuentoRetiroAlto,
      descuentoRetiroBajo,
      umbralDescuentoRetiro: umbral,
    });
    return serializarConfiguracion(config);
  }

  const nueva = await ConfiguracionEmpresa.create({
    id: 1,
    descuentoRetiroAlto,
    descuentoRetiroBajo,
    umbralDescuentoRetiro: umbral,
    moneda: 'BOB',
  });
  return serializarConfiguracion(nueva);
}

/**
 * Calcula el descuento automático por retiro en tienda.
 * [REQ-RET-02] 7% si subtotal >= umbral; 5% si subtotal < umbral.
 */
function calcularDescuentoRetiro(subtotal, configuracion) {
  const config = configuracion || CONFIG_DEFAULT;
  const montoSubtotal = round2(Number(subtotal) || 0);
  const umbral = Number(config.umbralDescuentoRetiro);
  const alto = Number(config.descuentoRetiroAlto);
  const bajo = Number(config.descuentoRetiroBajo);
  const porcentaje = montoSubtotal >= (Number.isFinite(umbral) ? umbral : 500) ? alto : bajo;
  const porcentajeSeguro = Number.isFinite(porcentaje) ? porcentaje : 0;
  const monto = round2((montoSubtotal * porcentajeSeguro) / 100);
  return { porcentaje: round2(porcentajeSeguro), monto };
}

async function listarSucursalesActivas() {
  const items = await Sucursal.findAll({
    where: { activa: true },
    order: [
      ['ciudad', 'ASC'],
      ['nombre', 'ASC'],
    ],
  });
  return items.map(serializarSucursal);
}

function serializarSucursal(sucursal) {
  if (!sucursal) return null;
  return {
    id: sucursal.id,
    nombre: sucursal.nombre,
    ciudad: sucursal.ciudad,
    direccion: sucursal.direccion,
    telefono: sucursal.telefono,
    horarios: sucursal.horarios,
    activa: Boolean(sucursal.activa),
    createdAt: sucursal.createdAt,
  };
}

function serializarProveedor(proveedor) {
  if (!proveedor) return null;
  return {
    id: proveedor.id,
    nombre: proveedor.nombre,
    direccion: proveedor.direccion,
    telefono: proveedor.telefono,
    correo: proveedor.correo,
    activo: Boolean(proveedor.activo),
    createdAt: proveedor.createdAt,
  };
}

function serializarComunicado(comunicado) {
  if (!comunicado) return null;
  const autor = comunicado.autor
    ? {
        id: comunicado.autor.id,
        nombre: comunicado.autor.nombre,
        email: comunicado.autor.email,
        rol: comunicado.autor.rol,
      }
    : null;
  return {
    id: comunicado.id,
    titulo: comunicado.titulo,
    contenido: comunicado.contenido,
    prioridad: comunicado.prioridad,
    autorId: comunicado.autorId,
    autor,
    fecha: comunicado.createdAt,
    createdAt: comunicado.createdAt,
    updatedAt: comunicado.updatedAt,
  };
}

async function listarComunicados() {
  const items = await Comunicado.findAll({
    include: [
      {
        model: Usuario,
        as: 'autor',
        attributes: ['id', 'nombre', 'email', 'rol'],
      },
    ],
    order: [
      ['createdAt', 'DESC'],
      ['id', 'DESC'],
    ],
  });
  return items.map(serializarComunicado);
}

function validarComunicado(payload = {}) {
  const titulo = String(payload.titulo || '').trim();
  const contenido = String(payload.contenido || '').trim();
  const prioridad = PRIORIDADES.includes(payload.prioridad)
    ? payload.prioridad
    : 'Informativo';

  const errores = [];
  if (titulo.length < 3 || titulo.length > 160) {
    errores.push({
      field: 'titulo',
      message: 'El título debe tener entre 3 y 160 caracteres',
    });
  }
  if (contenido.length < 3) {
    errores.push({
      field: 'contenido',
      message: 'El contenido del comunicado es obligatorio',
    });
  }
  if (payload.prioridad && !PRIORIDADES.includes(payload.prioridad)) {
    errores.push({
      field: 'prioridad',
      message: 'La prioridad debe ser Informativo, Importante o Urgente',
    });
  }
  if (errores.length) {
    throw new AppError('Revisa los datos del comunicado', 400, errores);
  }

  return { titulo, contenido, prioridad };
}

async function crearComunicado(usuario, payload = {}) {
  const data = validarComunicado(payload);
  const comunicado = await Comunicado.create({
    ...data,
    autorId: usuario.id,
  });
  const conAutor = await Comunicado.findByPk(comunicado.id, {
    include: [
      {
        model: Usuario,
        as: 'autor',
        attributes: ['id', 'nombre', 'email', 'rol'],
      },
    ],
  });
  return serializarComunicado(conAutor);
}

async function actualizarComunicado(id, payload = {}) {
  const comunicado = await Comunicado.findByPk(id);
  if (!comunicado) {
    throw new AppError('Comunicado no encontrado', 404);
  }
  const data = validarComunicado({ ...serializarComunicado(comunicado), ...payload });
  await comunicado.update(data);
  const conAutor = await Comunicado.findByPk(comunicado.id, {
    include: [
      {
        model: Usuario,
        as: 'autor',
        attributes: ['id', 'nombre', 'email', 'rol'],
      },
    ],
  });
  return serializarComunicado(conAutor);
}

async function eliminarComunicado(id) {
  const comunicado = await Comunicado.findByPk(id);
  if (!comunicado) {
    throw new AppError('Comunicado no encontrado', 404);
  }
  await comunicado.destroy();
  return { success: true, message: 'Comunicado eliminado correctamente' };
}

module.exports = {
  PRIORIDADES,
  CONFIG_DEFAULT,
  obtenerConfiguracion,
  actualizarConfiguracion,
  calcularDescuentoRetiro,
  listarSucursalesActivas,
  serializarSucursal,
  serializarProveedor,
  serializarComunicado,
  listarComunicados,
  crearComunicado,
  actualizarComunicado,
  eliminarComunicado,
};
