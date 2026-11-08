const distribucionService = require('../services/distribucionService');
const { Despacho } = require('../models');

async function cobertura(req, res, next) {
  try {
    res.json({
      ciudades: distribucionService.CIUDADES_COBERTURA,
      etapas: distribucionService.ETAPAS_DEFINICION,
    });
  } catch (err) {
    next(err);
  }
}

async function validarDireccion(req, res, next) {
  try {
    const input =
      (req.body && (req.body.direccionEntrega || req.body.datosEntrega)) ||
      req.body ||
      {};
    const datosEntrega = distribucionService.validarDireccionEntrega(input);
    res.json({ valida: true, datosEntrega });
  } catch (err) {
    next(err);
  }
}

async function tracking(req, res, next) {
  try {
    const rawParam =
      req.params.codigo || req.params.idOrCodigo || req.query.codigo || '';
    let codigo = String(rawParam).trim();

    if (/^\d+$/.test(codigo)) {
      const porVenta =
        (await Despacho.findOne({ where: { ventaId: Number(codigo) } })) ||
        (await Despacho.findByPk(Number(codigo)));
      if (porVenta && porVenta.codigoSeguimiento) {
        codigo = porVenta.codigoSeguimiento;
      }
    }

    const modoForzado =
      req.query.modo === 'publico' || req.query.vista === 'publica' ? 'publico' : null;

    const data = await distribucionService.consultarTracking({
      codigo,
      usuario: req.user || null,
      modoForzado,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function actualizarEstado(req, res, next) {
  try {
    const idOrCodigo =
      req.params.idOrCodigo ||
      req.params.codigo ||
      req.params.ventaId ||
      req.params.id ||
      (req.body && (req.body.codigoSeguimiento || req.body.ventaId || req.body.despachoId));
    const body = req.body || {};
    const nuevoEstado = body.estado || body.nuevoEstado || body.fase;

    const data = await distribucionService.actualizarEstadoDespacho({
      idOrCodigo,
      nuevoEstado,
      ubicacion: body.ubicacion || body.ubicacionActual || body.puntoControl,
      puntoControl: body.puntoControl || body.ubicacion,
      nota: body.nota || body.comentario || body.observacion,
      usuario: req.user,
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  cobertura,
  validarDireccion,
  tracking,
  actualizarEstado,
};
