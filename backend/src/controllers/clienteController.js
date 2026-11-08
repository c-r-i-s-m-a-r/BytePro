const clienteService = require('../services/clienteService');

async function listarPedidos(req, res, next) {
  try {
    const items = await clienteService.listarPedidos({ usuario: req.user });
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

async function detallePedido(req, res, next) {
  try {
    const ventaId = req.params.ventaId || req.params.id;
    const data = await clienteService.obtenerDetallePedido({
      usuario: req.user,
      ventaId,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function cancelarPedido(req, res, next) {
  try {
    const ventaId = req.params.ventaId || req.params.id;
    const data = await clienteService.cancelarPedido({
      usuario: req.user,
      ventaId,
      motivo: req.body && req.body.motivo,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function listarDirecciones(req, res, next) {
  try {
    const items = await clienteService.listarDirecciones({ usuario: req.user });
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

async function crearDireccion(req, res, next) {
  try {
    const data = await clienteService.crearDireccion({
      usuario: req.user,
      payload: req.body || {},
    });
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
}

async function actualizarDireccion(req, res, next) {
  try {
    const data = await clienteService.actualizarDireccion({
      usuario: req.user,
      direccionId: req.params.id,
      payload: req.body || {},
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function eliminarDireccion(req, res, next) {
  try {
    const data = await clienteService.eliminarDireccion({
      usuario: req.user,
      direccionId: req.params.id,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listarPedidos,
  detallePedido,
  cancelarPedido,
  listarDirecciones,
  crearDireccion,
  actualizarDireccion,
  eliminarDireccion,
};
