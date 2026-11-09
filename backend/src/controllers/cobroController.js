const cobroService = require('../services/cobroService');
const empresaService = require('../services/empresaService');
const AppError = require('../utils/AppError');

async function metodos(req, res, next) {
  try {
    res.json({ items: cobroService.listarMetodos() });
  } catch (err) {
    next(err);
  }
}

async function checkout(req, res, next) {
  try {
    const data = await cobroService.crearCheckout(req.user, req.body || {});
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
}

async function pagar(req, res, next) {
  try {
    const body = req.body || {};
    if (!body.ventaId) {
      throw new AppError('Se requiere el identificador de la venta', 400);
    }

    const idempotencyKey = req.get('Idempotency-Key') || body.idempotencyKey;
    const data = await cobroService.procesarPago({
      usuario: req.user,
      ventaId: body.ventaId,
      idempotencyKey,
      metodo: body.metodo,
      datosPago: body.datosPago || body.datos || {},
      direccionEntrega: body.direccionEntrega || body.datosEntrega || null,
      payload: body,
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function venta(req, res, next) {
  try {
    const data = await cobroService.obtenerVenta({
      usuario: req.user,
      ventaId: req.params.ventaId,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function recibo(req, res, next) {
  try {
    const data = await cobroService.obtenerRecibo({
      usuario: req.user,
      ventaId: req.params.ventaId,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function actualizarEntrega(req, res, next) {
  try {
    const body = req.body || {};
    if (!body.ventaId) {
      throw new AppError('Se requiere el identificador de la venta', 400);
    }
    const data = await cobroService.actualizarEntrega(req.user, body);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function sucursales(req, res, next) {
  try {
    const items = await empresaService.listarSucursalesActivas();
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  metodos,
  checkout,
  pagar,
  actualizarEntrega,
  sucursales,
  venta,
  recibo,
};
