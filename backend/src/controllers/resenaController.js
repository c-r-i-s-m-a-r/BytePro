const resenaService = require('../services/resenaService');

async function list(req, res, next) {
  try {
    const data = await resenaService.listarResenas(req.params.idOrSlug);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function crear(req, res, next) {
  try {
    const data = await resenaService.crearResena({
      productoId: req.params.idOrSlug,
      usuario: req.user,
      calificacion: req.body?.calificacion,
      comentario: req.body?.comentario,
    });
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, crear };
