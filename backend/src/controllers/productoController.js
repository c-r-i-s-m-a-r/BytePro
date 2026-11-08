const productService = require('../services/productService');

async function list(req, res, next) {
  try {
    const data = await productService.listProductos(req.query || {});
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function detail(req, res, next) {
  try {
    const data = await productService.getProducto(req.params.idOrSlug);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function comparar(req, res, next) {
  try {
    const data = await productService.comparar(req.query.ids);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function crear(req, res, next) {
  try {
    const data = await productService.crearProducto(req.body || {});
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
}

async function actualizar(req, res, next) {
  try {
    const data = await productService.actualizarProducto(
      req.params.idOrSlug,
      req.body || {}
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function eliminar(req, res, next) {
  try {
    const data = await productService.desactivarProducto(req.params.idOrSlug);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, detail, comparar, crear, actualizar, eliminar };
