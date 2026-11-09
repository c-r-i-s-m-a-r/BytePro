const { Proveedor, Sucursal } = require('../models');
const empresaService = require('../services/empresaService');
const AppError = require('../utils/AppError');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requerido(valor, campo, min = 2) {
  const texto = String(valor || '').trim();
  if (texto.length < min) {
    throw new AppError(`El campo ${campo} es obligatorio`, 400, [
      { field: campo, message: `Ingresa un valor válido para ${campo}` },
    ]);
  }
  return texto;
}

function validarProveedor(payload = {}) {
  const nombre = requerido(payload.nombre, 'nombre', 2).slice(0, 160);
  const direccion = requerido(payload.direccion, 'direccion', 4).slice(0, 255);
  const telefono = requerido(payload.telefono, 'telefono', 5).slice(0, 40);
  const correo = requerido(payload.correo, 'correo', 5).slice(0, 160).toLowerCase();

  if (!EMAIL_REGEX.test(correo)) {
    throw new AppError('El correo electrónico del proveedor no es válido', 400, [
      { field: 'correo', message: 'Ingresa un correo electrónico válido' },
    ]);
  }

  return { nombre, direccion, telefono, correo };
}

function validarSucursal(payload = {}) {
  return {
    nombre: requerido(payload.nombre, 'nombre', 2).slice(0, 120),
    ciudad: requerido(payload.ciudad, 'ciudad', 2).slice(0, 100),
    direccion: requerido(payload.direccion, 'direccion', 4).slice(0, 255),
    telefono: requerido(payload.telefono, 'telefono', 5).slice(0, 40),
    horarios: requerido(payload.horarios, 'horarios', 3).slice(0, 255),
  };
}

async function obtenerAjustes(req, res, next) {
  try {
    const [configuracion, proveedores, sucursales] = await Promise.all([
      empresaService.obtenerConfiguracion(),
      Proveedor.findAll({ order: [['id', 'ASC']] }),
      Sucursal.findAll({ order: [['id', 'ASC']] }),
    ]);

    res.json({
      configuracion,
      proveedores: proveedores.map(empresaService.serializarProveedor),
      sucursales: sucursales.map(empresaService.serializarSucursal),
    });
  } catch (err) {
    next(err);
  }
}

async function actualizarAjustes(req, res, next) {
  try {
    const configuracion = await empresaService.actualizarConfiguracion(req.body || {});
    res.json({ configuracion });
  } catch (err) {
    next(err);
  }
}

async function listarProveedores(req, res, next) {
  try {
    const items = await Proveedor.findAll({ order: [['id', 'ASC']] });
    res.json({ items: items.map(empresaService.serializarProveedor) });
  } catch (err) {
    next(err);
  }
}

async function crearProveedor(req, res, next) {
  try {
    const data = validarProveedor(req.body || {});
    const proveedor = await Proveedor.create({ ...data, activo: true });
    res.status(201).json({ proveedor: empresaService.serializarProveedor(proveedor) });
  } catch (err) {
    next(err);
  }
}

async function actualizarProveedor(req, res, next) {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    if (!proveedor) throw new AppError('Proveedor no encontrado', 404);

    const body = req.body || {};
    const data = {};
    if (body.nombre !== undefined) data.nombre = requerido(body.nombre, 'nombre', 2).slice(0, 160);
    if (body.direccion !== undefined) {
      data.direccion = requerido(body.direccion, 'direccion', 4).slice(0, 255);
    }
    if (body.telefono !== undefined) {
      data.telefono = requerido(body.telefono, 'telefono', 5).slice(0, 40);
    }
    if (body.correo !== undefined) {
      const correo = requerido(body.correo, 'correo', 5).slice(0, 160).toLowerCase();
      if (!EMAIL_REGEX.test(correo)) {
        throw new AppError('El correo electrónico del proveedor no es válido', 400, [
          { field: 'correo', message: 'Ingresa un correo electrónico válido' },
        ]);
      }
      data.correo = correo;
    }
    if (body.activo !== undefined) data.activo = Boolean(body.activo);

    await proveedor.update(data);
    res.json({ proveedor: empresaService.serializarProveedor(proveedor) });
  } catch (err) {
    next(err);
  }
}

async function eliminarProveedor(req, res, next) {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    if (!proveedor) throw new AppError('Proveedor no encontrado', 404);

    await proveedor.update({ activo: false });
    res.json({
      success: true,
      message: 'Proveedor dado de baja correctamente',
      proveedor: empresaService.serializarProveedor(proveedor),
    });
  } catch (err) {
    next(err);
  }
}

async function listarSucursales(req, res, next) {
  try {
    const items = await Sucursal.findAll({ order: [['id', 'ASC']] });
    res.json({ items: items.map(empresaService.serializarSucursal) });
  } catch (err) {
    next(err);
  }
}

async function crearSucursal(req, res, next) {
  try {
    const data = validarSucursal(req.body || {});
    const sucursal = await Sucursal.create({ ...data, activa: true });
    res.status(201).json({ sucursal: empresaService.serializarSucursal(sucursal) });
  } catch (err) {
    next(err);
  }
}

async function actualizarSucursal(req, res, next) {
  try {
    const sucursal = await Sucursal.findByPk(req.params.id);
    if (!sucursal) throw new AppError('Sucursal no encontrada', 404);

    const body = req.body || {};
    const data = {};
    if (body.nombre !== undefined) data.nombre = requerido(body.nombre, 'nombre', 2).slice(0, 120);
    if (body.ciudad !== undefined) data.ciudad = requerido(body.ciudad, 'ciudad', 2).slice(0, 100);
    if (body.direccion !== undefined) {
      data.direccion = requerido(body.direccion, 'direccion', 4).slice(0, 255);
    }
    if (body.telefono !== undefined) {
      data.telefono = requerido(body.telefono, 'telefono', 5).slice(0, 40);
    }
    if (body.horarios !== undefined) {
      data.horarios = requerido(body.horarios, 'horarios', 3).slice(0, 255);
    }
    if (body.activa !== undefined) data.activa = Boolean(body.activa);

    await sucursal.update(data);
    res.json({ sucursal: empresaService.serializarSucursal(sucursal) });
  } catch (err) {
    next(err);
  }
}

async function eliminarSucursal(req, res, next) {
  try {
    const sucursal = await Sucursal.findByPk(req.params.id);
    if (!sucursal) throw new AppError('Sucursal no encontrada', 404);

    await sucursal.update({ activa: false });
    res.json({
      success: true,
      message: 'Sucursal dada de baja correctamente',
      sucursal: empresaService.serializarSucursal(sucursal),
    });
  } catch (err) {
    next(err);
  }
}

async function listarComunicados(req, res, next) {
  try {
    const items = await empresaService.listarComunicados();
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

async function crearComunicado(req, res, next) {
  try {
    const comunicado = await empresaService.crearComunicado(req.user, req.body || {});
    res.status(201).json({ comunicado });
  } catch (err) {
    next(err);
  }
}

async function actualizarComunicado(req, res, next) {
  try {
    const comunicado = await empresaService.actualizarComunicado(
      req.params.id,
      req.body || {}
    );
    res.json({ comunicado });
  } catch (err) {
    next(err);
  }
}

async function eliminarComunicado(req, res, next) {
  try {
    const data = await empresaService.eliminarComunicado(req.params.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  obtenerAjustes,
  actualizarAjustes,
  listarProveedores,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor,
  listarSucursales,
  crearSucursal,
  actualizarSucursal,
  eliminarSucursal,
  listarComunicados,
  crearComunicado,
  actualizarComunicado,
  eliminarComunicado,
};
