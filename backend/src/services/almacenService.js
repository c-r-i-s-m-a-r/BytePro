const { Op } = require('sequelize');
const {
  sequelize,
  Inventario,
  Variante,
  Producto,
  BloqueoStock,
  Kardex,
  Usuario,
} = require('../models');
const AppError = require('../utils/AppError');

function aEntero(value) {
  const numero = Number(value);
  return Number.isInteger(numero) ? numero : null;
}

function normalizarMotivo(value, porDefecto) {
  const texto = String(value || '').trim();
  return (texto || porDefecto).slice(0, 255);
}

async function obtenerInventario(varianteId, transaction, crear = false) {
  let inventario = await Inventario.findOne({
    where: { varianteId },
    transaction,
  });

  if (!inventario && crear) {
    const variante = await Variante.findByPk(varianteId, { transaction });
    if (!variante) throw new AppError('Variante no encontrada', 404);
    inventario = await Inventario.create(
      { varianteId: variante.id, cantidad: 0, umbralBajo: 5 },
      { transaction }
    );
  }

  return inventario;
}

async function crearAsiento({
  varianteId,
  tipo,
  cantidad,
  stockAnterior,
  stockResultante,
  motivo,
  usuarioId = null,
  ventaId = null,
  checkoutId = null,
  referencia = null,
  transaction,
}) {
  return Kardex.create(
    {
      varianteId,
      tipo,
      cantidad,
      stockAnterior,
      stockResultante,
      motivo,
      usuarioId,
      ventaId,
      checkoutId,
      referencia,
    },
    { transaction }
  );
}

function serializarMovimiento(movimiento) {
  const variante = movimiento.variante;
  const producto = variante ? variante.producto : null;
  return {
    id: movimiento.id,
    varianteId: movimiento.varianteId,
    sku: variante ? variante.sku : null,
    producto: producto ? producto.nombre : null,
    marca: producto ? producto.marca : null,
    tipo: movimiento.tipo,
    cantidad: Number(movimiento.cantidad),
    stockAnterior: Number(movimiento.stockAnterior),
    stockResultante: Number(movimiento.stockResultante),
    motivo: movimiento.motivo,
    usuarioId: movimiento.usuarioId,
    usuario: movimiento.usuario
      ? {
          id: movimiento.usuario.id,
          nombre: movimiento.usuario.nombre,
          email: movimiento.usuario.email,
        }
      : null,
    ventaId: movimiento.ventaId,
    checkoutId: movimiento.checkoutId,
    referencia: movimiento.referencia,
    fecha: movimiento.createdAt,
  };
}

async function listarInventario() {
  const variantes = await Variante.findAll({
    where: { activo: true },
    include: [
      {
        model: Producto,
        as: 'producto',
        attributes: ['id', 'nombre', 'marca'],
      },
      { model: Inventario, as: 'inventario' },
    ],
    order: [['productoId', 'ASC']],
  });

  const bloqueos = await BloqueoStock.findAll({
    where: { estado: 'activo', expiraEn: { [Op.gt]: new Date() } },
    attributes: ['varianteId', 'cantidad'],
    raw: true,
  });

  const bloqueadosPorVariante = new Map();
  for (const bloqueo of bloqueos) {
    const key = Number(bloqueo.varianteId ?? bloqueo.variante_id);
    const cantidad = Number(bloqueo.cantidad) || 0;
    bloqueadosPorVariante.set(key, (bloqueadosPorVariante.get(key) || 0) + cantidad);
  }

  return variantes.map((variante) => {
    const cantidad = variante.inventario ? Number(variante.inventario.cantidad) : 0;
    const bloqueado = bloqueadosPorVariante.get(Number(variante.id)) || 0;
    const disponible = Math.max(0, cantidad - bloqueado);
    const umbralBajo = variante.inventario ? Number(variante.inventario.umbralBajo) : 0;

    return {
      varianteId: variante.id,
      sku: variante.sku,
      producto: variante.producto ? variante.producto.nombre : null,
      marca: variante.producto ? variante.producto.marca : null,
      cantidad,
      bloqueado,
      disponible,
      ubicacion: variante.inventario ? variante.inventario.ubicacion : null,
      umbralBajo,
      critico: disponible <= umbralBajo,
    };
  });
}

async function listarKardex({ varianteId, limit = 100 } = {}) {
  const where = {};
  if (varianteId) where.varianteId = aEntero(varianteId);

  const limite = Math.min(Math.max(aEntero(limit) || 100, 1), 500);

  const movimientos = await Kardex.findAll({
    where,
    include: [
      {
        model: Variante,
        as: 'variante',
        attributes: ['id', 'sku'],
        include: [{ model: Producto, as: 'producto', attributes: ['id', 'nombre', 'marca'] }],
      },
      { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email'] },
    ],
    order: [['id', 'DESC']],
    limit: limite,
  });

  return movimientos.map(serializarMovimiento);
}

async function registrarEntrada({ varianteId, cantidad, motivo, usuario }) {
  const varianteIdNum = aEntero(varianteId);
  const cantidadNum = aEntero(cantidad);

  if (!varianteIdNum) throw new AppError('Variante no válida', 400);
  if (cantidadNum === null || cantidadNum <= 0) {
    throw new AppError('La cantidad debe ser un entero positivo', 400);
  }

  return sequelize.transaction(async (transaction) => {
    const inventario = await obtenerInventario(varianteIdNum, transaction, true);
    const stockAnterior = Number(inventario.cantidad);
    const stockResultante = stockAnterior + cantidadNum;

    await inventario.update({ cantidad: stockResultante }, { transaction });

    const movimiento = await crearAsiento({
      varianteId: varianteIdNum,
      tipo: 'ENTRADA',
      cantidad: cantidadNum,
      stockAnterior,
      stockResultante,
      motivo: normalizarMotivo(motivo, 'Entrada de mercancía'),
      usuarioId: usuario ? usuario.id : null,
      transaction,
    });

    return {
      movimiento: serializarMovimiento(movimiento),
      inventario: { varianteId: varianteIdNum, cantidad: stockResultante },
    };
  });
}

async function registrarSalida({ varianteId, cantidad, motivo, usuario }) {
  const varianteIdNum = aEntero(varianteId);
  const cantidadNum = aEntero(cantidad);

  if (!varianteIdNum) throw new AppError('Variante no válida', 400);
  if (cantidadNum === null || cantidadNum <= 0) {
    throw new AppError('La cantidad debe ser un entero positivo', 400);
  }

  return sequelize.transaction(async (transaction) => {
    const inventario = await obtenerInventario(varianteIdNum, transaction, false);
    const stockAnterior = inventario ? Number(inventario.cantidad) : 0;
    const stockResultante = stockAnterior - cantidadNum;

    if (stockResultante < 0) {
      throw new AppError('La operación supera las existencias físicas disponibles', 400);
    }

    await inventario.update({ cantidad: stockResultante }, { transaction });

    const movimiento = await crearAsiento({
      varianteId: varianteIdNum,
      tipo: 'SALIDA',
      cantidad: cantidadNum,
      stockAnterior,
      stockResultante,
      motivo: normalizarMotivo(motivo, 'Salida manual de almacén'),
      usuarioId: usuario ? usuario.id : null,
      transaction,
    });

    return {
      movimiento: serializarMovimiento(movimiento),
      inventario: { varianteId: varianteIdNum, cantidad: stockResultante },
    };
  });
}

async function registrarAjuste({ varianteId, cantidad, nuevoStock, motivo, usuario }) {
  const varianteIdNum = aEntero(varianteId);
  const cantidadNum = aEntero(cantidad);
  const nuevoStockNum = aEntero(nuevoStock);

  if (!varianteIdNum) throw new AppError('Variante no válida', 400);
  if (cantidadNum === null && nuevoStockNum === null) {
    throw new AppError('Indica la cantidad del ajuste o el nuevo stock', 400);
  }

  return sequelize.transaction(async (transaction) => {
    const inventario = await obtenerInventario(varianteIdNum, transaction, true);
    const stockAnterior = Number(inventario.cantidad);
    const stockResultante =
      nuevoStockNum !== null ? nuevoStockNum : stockAnterior + cantidadNum;

    if (stockResultante < 0) {
      throw new AppError('La operación supera las existencias físicas disponibles', 400);
    }

    const delta = stockResultante - stockAnterior;
    if (delta === 0) {
      throw new AppError('El ajuste no produce cambios en el stock', 400);
    }

    await inventario.update({ cantidad: stockResultante }, { transaction });

    const movimiento = await crearAsiento({
      varianteId: varianteIdNum,
      tipo: 'AJUSTE',
      cantidad: delta,
      stockAnterior,
      stockResultante,
      motivo: normalizarMotivo(motivo, 'Ajuste manual de inventario'),
      usuarioId: usuario ? usuario.id : null,
      transaction,
    });

    return {
      movimiento: serializarMovimiento(movimiento),
      inventario: { varianteId: varianteIdNum, cantidad: stockResultante },
    };
  });
}

async function registrarReserva({
  checkoutId,
  ventaId,
  items,
  usuarioId,
  motivo,
  transaction,
}) {
  for (const item of items) {
    const cantidad = Number(item.cantidad);
    if (!cantidad || cantidad <= 0) continue;

    const inventario = await obtenerInventario(item.varianteId, transaction, false);
    const stock = inventario ? Number(inventario.cantidad) : 0;

    await crearAsiento({
      varianteId: item.varianteId,
      tipo: 'RESERVA_VENTA',
      cantidad,
      stockAnterior: stock,
      stockResultante: stock,
      motivo: normalizarMotivo(
        motivo,
        `Reserva temporal de stock para la venta #${ventaId}`
      ),
      usuarioId,
      ventaId,
      checkoutId,
      referencia: `checkout:${checkoutId}`,
      transaction,
    });
  }
}

async function registrarLiberacion({
  checkoutId,
  ventaId,
  items,
  usuarioId,
  motivo,
  transaction,
}) {
  for (const item of items) {
    const cantidad = Number(item.cantidad);
    if (!cantidad || cantidad <= 0) continue;

    const inventario = await obtenerInventario(item.varianteId, transaction, false);
    const stock = inventario ? Number(inventario.cantidad) : 0;

    await crearAsiento({
      varianteId: item.varianteId,
      tipo: 'LIBERACION_VENTA',
      cantidad,
      stockAnterior: stock,
      stockResultante: stock,
      motivo: normalizarMotivo(
        motivo,
        `Liberación de reserva de la venta #${ventaId}`
      ),
      usuarioId,
      ventaId,
      checkoutId,
      referencia: `checkout:${checkoutId}`,
      transaction,
    });
  }
}

async function registrarSalidaVenta({
  checkoutId,
  ventaId,
  items,
  usuarioId,
  transaction,
}) {
  for (const item of items) {
    const cantidad = Number(item.cantidad);
    if (!cantidad || cantidad <= 0) continue;

    const inventario = await obtenerInventario(item.varianteId, transaction, false);
    const stockAnterior = inventario ? Number(inventario.cantidad) : 0;
    const stockResultante = stockAnterior - cantidad;

    if (stockResultante < 0) {
      throw new AppError('La operación supera las existencias físicas disponibles', 400);
    }

    await inventario.update({ cantidad: stockResultante }, { transaction });

    await crearAsiento({
      varianteId: item.varianteId,
      tipo: 'SALIDA_VENTA',
      cantidad,
      stockAnterior,
      stockResultante,
      motivo: `Salida por venta #${ventaId}`,
      usuarioId,
      ventaId,
      checkoutId,
      referencia: `venta:${ventaId}`,
      transaction,
    });
  }
}

async function reintegrarPorCancelacion({
  ventaId,
  items,
  usuarioId,
  motivo,
  transaction,
}) {
  const reintegrados = [];
  for (const item of items) {
    const cantidad = Number(item.cantidad);
    if (!cantidad || cantidad <= 0) continue;

    // eslint-disable-next-line no-await-in-loop
    const inventario = await obtenerInventario(item.varianteId, transaction, true);
    const stockAnterior = Number(inventario.cantidad);
    const stockResultante = stockAnterior + cantidad;

    // eslint-disable-next-line no-await-in-loop
    await inventario.update({ cantidad: stockResultante }, { transaction });

    // eslint-disable-next-line no-await-in-loop
    const movimiento = await crearAsiento({
      varianteId: item.varianteId,
      tipo: 'ENTRADA',
      cantidad,
      stockAnterior,
      stockResultante,
      motivo: normalizarMotivo(
        motivo,
        `Reintegro de stock por cancelación de pedido #${ventaId}`
      ),
      usuarioId,
      ventaId,
      referencia: `cancelacion:${ventaId}`,
      transaction,
    });

    reintegrados.push({
      varianteId: item.varianteId,
      cantidad,
      stockAnterior,
      stockResultante,
      kardexId: movimiento.id,
    });
  }
  return reintegrados;
}

module.exports = {
  listarInventario,
  listarKardex,
  registrarEntrada,
  registrarSalida,
  registrarAjuste,
  registrarReserva,
  registrarLiberacion,
  registrarSalidaVenta,
  reintegrarPorCancelacion,
  serializarMovimiento,
};
