const soporteService = require('../services/soporteService');

async function crear(req, res, next) {
  try {
    const payload = {
      ...(req.body || {}),
      usuario: req.user || null,
    };
    const nuevo = await soporteService.crearReclamo(payload);
    res.status(201).json(nuevo);
  } catch (err) {
    next(err);
  }
}

async function listar(req, res, next) {
  try {
    const data = await soporteService.listarReclamos(req.query || {});
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function detalle(req, res, next) {
  try {
    const item = await soporteService.obtenerReclamoPorIdOCodigo(req.params.idOrCodigo);
    res.json(item);
  } catch (err) {
    next(err);
  }
}

async function tomarCaso(req, res, next) {
  try {
    const item = await soporteService.tomarCaso({
      idOrCodigo: req.params.idOrCodigo,
      usuario: req.user,
    });
    res.json(item);
  } catch (err) {
    next(err);
  }
}

async function resolverCaso(req, res, next) {
  try {
    const item = await soporteService.resolverCaso({
      idOrCodigo: req.params.idOrCodigo,
      solucion: req.body?.solucion || req.body?.notas,
      usuario: req.user,
    });
    res.json(item);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  crear,
  listar,
  detalle,
  tomarCaso,
  resolverCaso,
};
