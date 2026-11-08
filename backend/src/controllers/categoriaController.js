const productService = require('../services/productService');

async function list(req, res, next) {
  try {
    const data = await productService.listCategorias();
    res.json({ items: data });
  } catch (err) {
    next(err);
  }
}

async function detail(req, res, next) {
  try {
    const categoria = await productService.getCategoria(req.params.idOrSlug);
    res.json(categoria);
  } catch (err) {
    next(err);
  }
}

async function crear(req, res, next) {
  try {
    const data = await productService.crearCategoria(req.body || {});
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, detail, crear };
