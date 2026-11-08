const { Op } = require('sequelize');
const {
  sequelize,
  Venta,
  VentaItem,
  Variante,
  Producto,
  Despacho,
  Recibo,
  Transaccion,
  Checkout,
  Direccion,
  Cliente,
} = require('../models');
const AppError = require('../utils/AppError');
const env = require('../config/env');
const { round2 } = require('../utils/money');
const { STAFF_ROLES } = require('../middlewares/rbac');
const almacenService = require('./almacenService');
const distribucionService = require('./distribucionService');
const cobroService = require('./cobroService');

function serializarDireccion(dir) {
  if (!dir) return null;
  return {
    id: dir.id,
    usuarioId: dir.usuarioId,
    etiqueta: dir.etiqueta,
    alias: dir.etiqueta,
    nombreDestinatario: dir.nombreDestinatario,
    destinatario: dir.nombreDestinatario,
    calle: dir.calle,
    direccion: dir.calle,
    direccionExacta: dir.calle,
    ciudad: dir.ciudad,
    telefono: dir.telefono,
    referencias: dir.referencias || null,
    notas: dir.referencias || null,
    predeterminada: Boolean(dir.predeterminada),
    createdAt: dir.createdAt,
    updatedAt: dir.updatedAt,
  };
}

function esCancelable(ventaEstado, estadoLogistico) {
  const vnt = String(ventaEstado || '').toUpperCase();
  if (vnt === 'CANCELADO' || vnt === 'CANCELADA') return false;
  if (vnt === 'ENVIADA' || vnt === 'ENTREGADA') return false;
  const log = distribucionService.normalizarEstadoLogistico(estadoLogistico);
  return ['PEDIDO_CONFIRMADO', 'PREPARANDO_PEDIDO', 'EN_PREPARACION'].includes(log);
}

function serializarResumenPedido(venta) {
  const despacho = venta.despacho
    ? distribucionService.serializarDespacho(venta.despacho)
    : null;
  const estadoLogistica = despacho
    ? despacho.estado
    : venta.estado === 'cancelada' || venta.estado === 'CANCELADO'
      ? 'CANCELADO'
      : venta.estado === 'entregada'
        ? 'ENTREGADO'
        : venta.estado === 'enviada'
          ? 'EN_CAMINO'
          : 'PEDIDO_CONFIRMADO';

  const pildora = distribucionService.etiquetaPildoraPedido(venta.estado, estadoLogistica);
  const puedeCancelar = esCancelable(venta.estado, estadoLogistica);
  const codigoSeguimiento = despacho ? despacho.codigoSeguimiento : null;

  const items = (venta.items || []).map((item) => {
    const variante = item.variante;
    const producto = variante ? variante.producto : null;
    const cantidad = Number(item.cantidad) || 0;
    const precioUnitario = Number(item.precioUnitario) || 0;
    return {
      varianteId: item.varianteId,
      sku: variante ? variante.sku : null,
      nombreProducto: producto ? producto.nombre : 'Producto',
      marca: producto ? producto.marca : null,
      nombreVariante: variante ? variante.nombre : null,
      atributos: variante ? variante.atributos || {} : {},
      imagen:
        (variante && variante.imagenes && variante.imagenes[0]) ||
        (producto && (producto.imagenPrincipal || (producto.imagenes || [])[0])) ||
        null,
      cantidad,
      precioUnitario: round2(precioUnitario),
      subtotal: round2(precioUnitario * cantidad),
    };
  });

  const transacciones = (venta.transacciones || []).slice().sort((a, b) => b.id - a.id);
  const metodoPago =
    (venta.recibo && venta.recibo.metodo) ||
    (transacciones[0] && transacciones[0].metodo) ||
    'tarjeta';

  return {
    id: venta.id,
    ventaId: venta.id,
    numeroPedido: `PED-${String(venta.id).padStart(4, '0')}`,
    fecha: venta.createdAt,
    fechaCompra: venta.createdAt,
    total: Number(venta.total),
    totalPagado: Number(venta.total),
    moneda: (venta.checkout && venta.checkout.moneda) || env.currency,
    estado: venta.estado,
    estadoLogistica,
    pildora,
    estadoActual: pildora,
    puedeCancelar,
    metodoPago,
    codigoSeguimiento,
    trackingCode: codigoSeguimiento,
    seguimientoUrl: codigoSeguimiento ? `/seguimiento/${codigoSeguimiento}` : null,
    datosEntrega: despacho ? despacho.datosEntrega : null,
    direccionDespacho: despacho ? despacho.datosEntrega : null,
    recibo: venta.recibo
      ? {
          id: venta.recibo.id,
          numero: venta.recibo.numero,
          subtotal: Number(venta.recibo.subtotal),
          impuestos: Number(venta.recibo.impuestos),
          total: Number(venta.recibo.total),
          metodo: venta.recibo.metodo,
          codigoTransaccion: venta.recibo.codigoTransaccion,
          fecha: venta.recibo.createdAt,
        }
      : null,
    comprobante: venta.recibo
      ? {
          id: venta.recibo.id,
          numero: venta.recibo.numero,
          total: Number(venta.recibo.total),
          url: `/recibo/${venta.id}`,
        }
      : null,
    despacho,
    items,
  };
}

async function listarPedidos({ usuario }) {
  const ventas = await Venta.findAll({
    where: {
      usuarioId: usuario.id,
      estado: { [Op.ne]: 'pendiente' },
    },
    include: [
      {
        model: VentaItem,
        as: 'items',
        include: [
          {
            model: Variante,
            as: 'variante',
            include: [{ model: Producto, as: 'producto' }],
          },
        ],
      },
      { model: Despacho, as: 'despacho' },
      { model: Recibo, as: 'recibo' },
      { model: Checkout, as: 'checkout' },
      { model: Transaccion, as: 'transacciones' },
    ],
    order: [
      ['createdAt', 'DESC'],
      ['id', 'DESC'],
    ],
  });

  return ventas.map(serializarResumenPedido);
}

async function obtenerDetallePedido({ usuario, ventaId }) {
  const detalle = await cobroService.obtenerVenta({ usuario, ventaId });
  return {
    ...detalle,
    ventaId: detalle.id,
    fechaCompra: detalle.fecha,
    totalPagado: detalle.total,
    estadoActual: detalle.pildora,
    codigoSeguimiento: detalle.despacho ? detalle.despacho.codigoSeguimiento : null,
    trackingCode: detalle.despacho ? detalle.despacho.codigoSeguimiento : null,
    direccionDespacho: detalle.datosEntrega,
    comprobante: detalle.recibo,
  };
}

async function cancelarPedido({ usuario, ventaId, motivo }) {
  const venta = await Venta.findByPk(ventaId, {
    include: [
      { model: VentaItem, as: 'items' },
      { model: Despacho, as: 'despacho' },
    ],
  });

  if (!venta) {
    throw new AppError('Pedido no encontrado', 404);
  }

  const esPropietario = Number(venta.usuarioId) === Number(usuario.id);
  if (!esPropietario && !STAFF_ROLES.includes(usuario.rol)) {
    throw new AppError('No tienes permisos para cancelar este pedido', 403);
  }

  const estadoLogistico = venta.despacho
    ? distribucionService.normalizarEstadoLogistico(venta.despacho.estado)
    : venta.estado === 'enviada'
      ? 'EN_CAMINO'
      : venta.estado === 'entregada'
        ? 'ENTREGADO'
        : 'PEDIDO_CONFIRMADO';

  if (
    estadoLogistico === 'EN_CAMINO' ||
    estadoLogistico === 'ENTREGADO' ||
    venta.estado === 'enviada' ||
    venta.estado === 'entregada'
  ) {
    throw new AppError(
      'El pedido ya se encuentra en ruta de entrega y no puede ser cancelado directamente',
      400
    );
  }

  if (
    venta.estado === 'CANCELADO' ||
    venta.estado === 'cancelada' ||
    estadoLogistico === 'CANCELADO'
  ) {
    throw new AppError('El pedido ya fue cancelado previamente', 400);
  }

  const motivoFinal =
    String(motivo || '').trim() ||
    `Reintegro de stock por cancelación de pedido #${venta.id}`;
  let stockReintegrado = [];

  await sequelize.transaction(async (transaction) => {
    await venta.update({ estado: 'CANCELADO' }, { transaction });

    if (venta.despacho) {
      const historialActual = Array.isArray(venta.despacho.historial)
        ? venta.despacho.historial
        : [];
      const eventoCancelacion = {
        estado: 'CANCELADO',
        timestamp: new Date().toISOString(),
        ubicacion: venta.despacho.ubicacionActual || 'Cancelado por el cliente',
        puntoControl: 'Cancelación antes de despacho a ruta',
        nota: motivoFinal,
        usuarioId: usuario.id,
      };
      await venta.despacho.update(
        {
          estado: 'CANCELADO',
          nota: motivoFinal,
          historial: [...historialActual, eventoCancelacion],
        },
        { transaction }
      );
    }

    stockReintegrado = await almacenService.reintegrarPorCancelacion({
      ventaId: venta.id,
      items: (venta.items || []).map((item) => ({
        varianteId: item.varianteId,
        cantidad: Number(item.cantidad),
      })),
      usuarioId: usuario.id,
      motivo: motivoFinal,
      transaction,
    });
  });

  const detalleActualizado = await obtenerDetallePedido({ usuario, ventaId: venta.id });
  return {
    ...detalleActualizado,
    stockReintegrado,
  };
}

async function listarDirecciones({ usuario }) {
  const direcciones = await Direccion.findAll({
    where: { usuarioId: usuario.id },
    order: [
      ['predeterminada', 'DESC'],
      ['id', 'DESC'],
    ],
  });
  return direcciones.map(serializarDireccion);
}

async function crearDireccion({ usuario, payload = {} }) {
  const etiqueta = String(
    payload.etiqueta ?? payload.alias ?? payload.tipo ?? 'Casa'
  )
    .trim()
    .slice(0, 60) || 'Casa';

  const validada = distribucionService.validarDireccionEntrega({
    nombreDestinatario:
      payload.nombreDestinatario ??
      payload.destinatario ??
      payload.nombre ??
      usuario.nombre,
    direccion: payload.calle ?? payload.direccion ?? payload.direccionExacta,
    ciudad: payload.ciudad,
    telefono: payload.telefono ?? payload.telefonoContacto ?? usuario.telefono,
    notas: payload.referencias ?? payload.notas ?? payload.notasEntrega,
    fueraDeCobertura: payload.fueraDeCobertura,
  });

  const totalPrevias = await Direccion.count({ where: { usuarioId: usuario.id } });
  const esPredeterminada =
    payload.predeterminada !== undefined
      ? Boolean(payload.predeterminada)
      : totalPrevias === 0;

  let creada = null;
  await sequelize.transaction(async (transaction) => {
    if (esPredeterminada) {
      await Direccion.update(
        { predeterminada: false },
        { where: { usuarioId: usuario.id }, transaction }
      );
    }

    creada = await Direccion.create(
      {
        usuarioId: usuario.id,
        etiqueta,
        nombreDestinatario: validada.nombreDestinatario,
        calle: validada.direccion,
        ciudad: validada.ciudad,
        telefono: validada.telefono,
        referencias: validada.notas,
        predeterminada: esPredeterminada,
      },
      { transaction }
    );

    const perfil = await Cliente.findOne({
      where: { usuarioId: usuario.id },
      transaction,
    });
    if (perfil && (esPredeterminada || !perfil.direccion)) {
      await perfil.update({ direccion: validada.direccion }, { transaction });
    }
  });

  return serializarDireccion(creada);
}

async function actualizarDireccion({ usuario, direccionId, payload = {} }) {
  const direccion = await Direccion.findOne({
    where: { id: Number(direccionId), usuarioId: usuario.id },
  });
  if (!direccion) {
    throw new AppError('Dirección no encontrada', 404);
  }

  const etiqueta =
    payload.etiqueta !== undefined || payload.alias !== undefined
      ? String(payload.etiqueta ?? payload.alias).trim().slice(0, 60) || direccion.etiqueta
      : direccion.etiqueta;

  const validada = distribucionService.validarDireccionEntrega({
    nombreDestinatario:
      payload.nombreDestinatario ??
      payload.destinatario ??
      direccion.nombreDestinatario,
    direccion: payload.calle ?? payload.direccion ?? direccion.calle,
    ciudad: payload.ciudad ?? direccion.ciudad,
    telefono: payload.telefono ?? direccion.telefono,
    notas:
      payload.referencias !== undefined || payload.notas !== undefined
        ? payload.referencias ?? payload.notas
        : direccion.referencias,
  });

  const predeterminada =
    payload.predeterminada !== undefined
      ? Boolean(payload.predeterminada)
      : direccion.predeterminada;

  await sequelize.transaction(async (transaction) => {
    if (predeterminada) {
      await Direccion.update(
        { predeterminada: false },
        { where: { usuarioId: usuario.id }, transaction }
      );
    }
    await direccion.update(
      {
        etiqueta,
        nombreDestinatario: validada.nombreDestinatario,
        calle: validada.direccion,
        ciudad: validada.ciudad,
        telefono: validada.telefono,
        referencias: validada.notas,
        predeterminada,
      },
      { transaction }
    );
  });

  return serializarDireccion(direccion);
}

async function eliminarDireccion({ usuario, direccionId }) {
  const direccion = await Direccion.findOne({
    where: { id: Number(direccionId), usuarioId: usuario.id },
  });
  if (!direccion) {
    throw new AppError('Dirección no encontrada', 404);
  }
  await direccion.destroy();
  return { id: Number(direccionId), eliminada: true };
}

module.exports = {
  listarPedidos,
  obtenerDetallePedido,
  cancelarPedido,
  listarDirecciones,
  crearDireccion,
  actualizarDireccion,
  eliminarDireccion,
  serializarDireccion,
  serializarResumenPedido,
};
