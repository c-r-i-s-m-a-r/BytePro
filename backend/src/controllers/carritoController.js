const crypto = require('crypto');
const carritoService = require('../services/carritoService');

function contexto(req, res) {
  let sessionId = req.headers['x-session-id'] || req.query.sessionId || null;

  if (req.user) {
    return { usuario: req.user, sessionId };
  }

  if (!sessionId) sessionId = crypto.randomUUID();
  res.setHeader('x-session-id', sessionId);
  return { usuario: null, sessionId };
}

async function get(req, res, next) {
  try {
    const data = await carritoService.obtenerCarrito(contexto(req, res));
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function agregar(req, res, next) {
  try {
    const data = await carritoService.agregarItem({
      ...contexto(req, res),
      varianteId: req.body?.varianteId,
      cantidad: req.body?.cantidad,
    });
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
}

async function actualizar(req, res, next) {
  try {
    const data = await carritoService.actualizarItem({
      ...contexto(req, res),
      itemId: req.params.itemId,
      cantidad: req.body?.cantidad,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function eliminar(req, res, next) {
  try {
    const data = await carritoService.eliminarItem({
      ...contexto(req, res),
      itemId: req.params.itemId,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function vaciar(req, res, next) {
  try {
    const data = await carritoService.vaciarCarrito(contexto(req, res));
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { get, agregar, actualizar, eliminar, vaciar };
