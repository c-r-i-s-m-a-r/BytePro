const almacenService = require('../services/almacenService');

async function inventario(req, res, next) {
  try {
    const items = await almacenService.listarInventario();
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

async function kardex(req, res, next) {
  try {
    const items = await almacenService.listarKardex({
      varianteId: req.query.varianteId,
      limit: req.query.limit,
    });
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

async function entrada(req, res, next) {
  try {
    const data = await almacenService.registrarEntrada({
      varianteId: req.body?.varianteId,
      cantidad: req.body?.cantidad,
      motivo: req.body?.motivo,
      usuario: req.user,
    });
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
}

async function salida(req, res, next) {
  try {
    const data = await almacenService.registrarSalida({
      varianteId: req.body?.varianteId,
      cantidad: req.body?.cantidad,
      motivo: req.body?.motivo,
      usuario: req.user,
    });
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
}

async function ajuste(req, res, next) {
  try {
    const data = await almacenService.registrarAjuste({
      varianteId: req.body?.varianteId,
      cantidad: req.body?.cantidad,
      nuevoStock: req.body?.nuevoStock,
      motivo: req.body?.motivo,
      usuario: req.user,
    });
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { inventario, kardex, entrada, salida, ajuste };
