const {
  sequelize,
  Carrito,
  CarritoItem,
  Variante,
  Producto,
  Inventario,
} = require('../models');
const AppError = require('../utils/AppError');

function stockDe(variante) {
  return variante && variante.inventario ? Number(variante.inventario.cantidad) || 0 : 0;
}

function combinarAvisos(...avisos) {
  const mensajes = avisos.filter(Boolean);
  return mensajes.length ? mensajes.join(' ') : null;
}

async function getOrCreateCart({ usuario, sessionId }) {
  if (usuario) {
    let carrito = await Carrito.findOne({
      where: { usuarioId: usuario.id, estado: 'activo' },
    });
    if (!carrito) carrito = await Carrito.create({ usuarioId: usuario.id });
    return carrito;
  }

  if (!sessionId) {
    throw new AppError('Se requiere identificar la sesión del carrito', 400);
  }
  let carrito = await Carrito.findOne({ where: { sessionId, estado: 'activo' } });
  if (!carrito) carrito = await Carrito.create({ sessionId });
  return carrito;
}

async function fusionarCarritoInvitado({ usuario, sessionId, destino }) {
  if (!usuario || !sessionId || !destino) return null;

  const invitado = await Carrito.findOne({
    where: { sessionId, estado: 'activo', usuarioId: null },
  });

  if (!invitado || Number(invitado.id) === Number(destino.id)) return null;

  const avisos = [];

  await sequelize.transaction(async (transaction) => {
    const items = await CarritoItem.findAll({
      where: { carritoId: invitado.id },
      include: [
        {
          model: Variante,
          as: 'variante',
          include: [{ model: Inventario, as: 'inventario' }],
        },
      ],
      transaction,
    });

    for (const item of items) {
      const stock = stockDe(item.variante);
      const sku = item.variante ? item.variante.sku : `#${item.varianteId}`;

      if (stock <= 0) {
        avisos.push(`El producto ${sku} ya no tiene stock y no se agregó.`);
        continue;
      }

      const existente = await CarritoItem.findOne({
        where: { carritoId: destino.id, varianteId: item.varianteId },
        transaction,
      });

      const cantidadPrevia = existente ? Number(existente.cantidad) : 0;
      const cantidadSolicitada = cantidadPrevia + Number(item.cantidad);
      const cantidadFinal = Math.min(stock, cantidadSolicitada);

      if (cantidadFinal > cantidadPrevia) {
        if (existente) {
          await existente.update({ cantidad: cantidadFinal }, { transaction });
        } else {
          await CarritoItem.create(
            {
              carritoId: destino.id,
              varianteId: item.varianteId,
              cantidad: cantidadFinal,
            },
            { transaction }
          );
        }
      }

      if (cantidadFinal < cantidadSolicitada) {
        avisos.push(`Solo quedan ${stock} unidades de ${sku}; se ajustó la cantidad.`);
      }
    }

    await CarritoItem.destroy({ where: { carritoId: invitado.id }, transaction });
    await invitado.destroy({ transaction });
  });

  return combinarAvisos(...avisos);
}

async function prepararCarrito({ usuario, sessionId }) {
  const carrito = await getOrCreateCart({
    usuario,
    sessionId: usuario ? null : sessionId,
  });

  let aviso = null;
  if (usuario && sessionId) {
    aviso = await fusionarCarritoInvitado({ usuario, sessionId, destino: carrito });
  }

  return { carrito, aviso };
}

async function serializarCarrito(carritoId) {
  const carrito = await Carrito.findByPk(carritoId, {
    include: [
      {
        model: CarritoItem,
        as: 'items',
        include: [
          {
            model: Variante,
            as: 'variante',
            include: [
              { model: Producto, as: 'producto' },
              { model: Inventario, as: 'inventario' },
            ],
          },
        ],
      },
    ],
  });

  if (!carrito) throw new AppError('Carrito no encontrado', 404);

  const items = (carrito.items || []).map((item) => {
    const variante = item.variante;
    const producto = variante ? variante.producto : null;
    const precio =
      variante && variante.precioVenta !== null && variante.precioVenta !== undefined
        ? Number(variante.precioVenta)
        : producto
          ? Number(producto.precioVenta)
          : 0;
    const stock = stockDe(variante);
    return {
      id: item.id,
      varianteId: item.varianteId,
      cantidad: item.cantidad,
      sku: variante ? variante.sku : null,
      productoId: producto ? producto.id : null,
      nombreProducto: producto ? producto.nombre : 'Producto',
      nombreVariante: variante ? variante.nombre : null,
      atributos: variante ? variante.atributos : {},
      imagen:
        (variante && variante.imagenes && variante.imagenes[0]) ||
        (producto && (producto.imagenPrincipal || (producto.imagenes || [])[0])) ||
        null,
      precioUnitario: precio,
      subtotal: Number((precio * item.cantidad).toFixed(2)),
      stock,
      disponible: stock > 0,
    };
  });

  const total = Number(items.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2));
  const unidades = items.reduce((sum, i) => sum + i.cantidad, 0);

  return {
    id: carrito.id,
    estado: carrito.estado,
    items,
    total,
    unidades,
  };
}

async function obtenerCarrito({ usuario, sessionId }) {
  const { carrito, aviso } = await prepararCarrito({ usuario, sessionId });
  const data = await serializarCarrito(carrito.id);
  return { ...data, warning: aviso };
}

async function agregarItem({ usuario, sessionId, varianteId, cantidad }) {
  const variante = await Variante.findByPk(varianteId, {
    include: [
      { model: Producto, as: 'producto' },
      { model: Inventario, as: 'inventario' },
    ],
  });

  if (!variante || !variante.activo || !variante.producto || !variante.producto.activo) {
    throw new AppError('Producto no encontrado', 404);
  }

  const stock = stockDe(variante);
  if (stock <= 0) {
    throw new AppError('Producto agotado', 409);
  }

  let cantidadSolicitada = parseInt(cantidad, 10);
  if (!Number.isInteger(cantidadSolicitada) || cantidadSolicitada < 1) {
    cantidadSolicitada = 1;
  }

  let warning = null;
  if (cantidadSolicitada > stock) {
    cantidadSolicitada = stock;
    warning = `Solo quedan ${stock} unidades disponibles`;
  }

  const { carrito, aviso } = await prepararCarrito({ usuario, sessionId });

  let item = await CarritoItem.findOne({
    where: { carritoId: carrito.id, varianteId: variante.id },
  });

  const nuevaCantidad = (item ? item.cantidad : 0) + cantidadSolicitada;
  let cantidadFinal = nuevaCantidad;
  if (nuevaCantidad > stock) {
    cantidadFinal = stock;
    warning = `Solo quedan ${stock} unidades disponibles`;
  }

  if (item) {
    await item.update({ cantidad: cantidadFinal });
  } else {
    item = await CarritoItem.create({
      carritoId: carrito.id,
      varianteId: variante.id,
      cantidad: cantidadFinal,
    });
  }

  const data = await serializarCarrito(carrito.id);
  return { ...data, warning: combinarAvisos(aviso, warning), itemId: item.id };
}

async function actualizarItem({ usuario, sessionId, itemId, cantidad }) {
  const { carrito, aviso } = await prepararCarrito({ usuario, sessionId });
  const item = await CarritoItem.findOne({
    where: { id: itemId, carritoId: carrito.id },
    include: [
      {
        model: Variante,
        as: 'variante',
        include: [{ model: Inventario, as: 'inventario' }],
      },
    ],
  });

  if (!item) throw new AppError('Ítem del carrito no encontrado', 404);

  const stock = stockDe(item.variante);
  let cantidadSolicitada = parseInt(cantidad, 10);
  if (!Number.isInteger(cantidadSolicitada) || cantidadSolicitada < 0) {
    throw new AppError('Cantidad inválida', 400);
  }

  let warning = null;
  if (cantidadSolicitada > stock) {
    cantidadSolicitada = stock;
    warning = `Solo quedan ${stock} unidades disponibles`;
  }

  if (cantidadSolicitada === 0) {
    await item.destroy();
  } else {
    await item.update({ cantidad: cantidadSolicitada });
  }

  const data = await serializarCarrito(carrito.id);
  return { ...data, warning: combinarAvisos(aviso, warning) };
}

async function eliminarItem({ usuario, sessionId, itemId }) {
  const { carrito, aviso } = await prepararCarrito({ usuario, sessionId });
  const item = await CarritoItem.findOne({
    where: { id: itemId, carritoId: carrito.id },
  });
  if (!item) throw new AppError('Ítem del carrito no encontrado', 404);
  await item.destroy();
  const data = await serializarCarrito(carrito.id);
  return { ...data, warning: aviso };
}

async function vaciarCarrito({ usuario, sessionId }) {
  const { carrito, aviso } = await prepararCarrito({ usuario, sessionId });
  await CarritoItem.destroy({ where: { carritoId: carrito.id } });
  const data = await serializarCarrito(carrito.id);
  return { ...data, warning: aviso };
}

module.exports = {
  obtenerCarrito,
  agregarItem,
  actualizarItem,
  eliminarItem,
  vaciarCarrito,
  serializarCarrito,
};
