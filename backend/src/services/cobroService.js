const { Op } = require('sequelize');
const {
  sequelize,
  Carrito,
  CarritoItem,
  Variante,
  Producto,
  Inventario,
  Usuario,
  Venta,
  VentaItem,
  Checkout,
  CheckoutItem,
  BloqueoStock,
  Transaccion,
  Recibo,
  Despacho,
  EventoAuditoria,
  Direccion,
  Sucursal,
} = require('../models');
const AppError = require('../utils/AppError');
const env = require('../config/env');
const { round2, toCents, formatearMonto } = require('../utils/money');
const { isValidToken, isValidTokenPasarela } = require('../utils/card');
const { STAFF_ROLES } = require('../middlewares/rbac');
const pasarelaService = require('./pasarelaService');
const reciboService = require('./reciboService');
const emailService = require('./emailService');
const auditoriaService = require('./auditoriaService');
const almacenService = require('./almacenService');
const distribucionService = require('./distribucionService');
const empresaService = require('./empresaService');

const METODOS_PAGO = [
  {
    id: 'tarjeta',
    nombre: 'Tarjeta de crédito o débito',
    descripcion: 'Pago tokenizado. No almacenamos el número completo ni el CVV.',
  },
  {
    id: 'transferencia',
    nombre: 'Transferencia bancaria',
    descripcion: 'Escanea el QR o usa los datos de la cuenta y registra tu comprobante.',
  },
  {
    id: 'pasarela',
    nombre: 'Pasarela digital',
    descripcion: 'Stripe o PayPal en entorno sandbox simulado.',
  },
];

function tasaImpuesto() {
  return Number.isFinite(env.taxRate) && env.taxRate >= 0 ? env.taxRate : 0.13;
}

function minutosBloqueo() {
  return Number.isInteger(env.stockLockMinutes) && env.stockLockMinutes > 0
    ? env.stockLockMinutes
    : 10;
}

function listarMetodos() {
  return METODOS_PAGO;
}

function serializarLinea(linea) {
  return {
    varianteId: linea.varianteId,
    sku: linea.sku,
    nombreProducto: linea.nombreProducto,
    nombreVariante: linea.nombreVariante,
    atributos: linea.atributos || {},
    imagen: linea.imagen || null,
    cantidad: linea.cantidad,
    precioUnitario: round2(linea.precioUnitario),
    subtotal: round2(linea.subtotal),
  };
}

function serializarTransaccion(transaccion) {
  if (!transaccion) return null;
  return {
    id: transaccion.id,
    codigoTransaccion: transaccion.codigoTransaccion,
    metodo: transaccion.metodo,
    proveedor: transaccion.proveedor,
    monto: Number(transaccion.monto),
    montoPasarela:
      transaccion.montoPasarela === null || transaccion.montoPasarela === undefined
        ? null
        : Number(transaccion.montoPasarela),
    moneda: transaccion.moneda,
    estado: transaccion.estado,
    motivoRechazo: transaccion.motivoRechazo,
    referenciaExterna: transaccion.referenciaExterna,
    ultimos4: transaccion.ultimos4,
    marcaTarjeta: transaccion.marcaTarjeta,
    fechaProcesado: transaccion.fechaProcesado,
  };
}

function normalizarItems(items) {
  if (!items) return [];
  if (Array.isArray(items)) return items;
  if (typeof items === 'string') {
    try {
      const parsed = JSON.parse(items);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }
  return [];
}

function serializarRecibo(recibo) {
  if (!recibo) return null;
  return {
    id: recibo.id,
    numero: recibo.numero,
    ventaId: recibo.ventaId,
    transaccionId: recibo.transaccionId,
    subtotal: Number(recibo.subtotal),
    descuentoRetiro: Number(recibo.descuentoRetiro) || 0,
    descuentoPorcentaje: Number(recibo.descuentoPorcentaje) || 0,
    impuestos: Number(recibo.impuestos),
    total: Number(recibo.total),
    moneda: recibo.moneda,
    metodo: recibo.metodo,
    codigoTransaccion: recibo.codigoTransaccion,
    clienteNombre: recibo.clienteNombre,
    clienteEmail: recibo.clienteEmail,
    metodoEntrega: recibo.metodoEntrega || 'domicilio',
    sucursal: recibo.sucursalNombre
      ? {
          nombre: recibo.sucursalNombre,
          ciudad: recibo.sucursalCiudad,
          direccion: recibo.sucursalDireccion,
          telefono: recibo.sucursalTelefono,
          horarios: recibo.sucursalHorarios,
        }
      : null,
    items: normalizarItems(recibo.items),
    enviadoEn: recibo.enviadoEn,
    fecha: recibo.createdAt,
  };
}

function calcularTotales(items, opciones = {}) {
  const lineas = (items || []).map((item) => {
    const variante = item.variante;
    const producto = variante ? variante.producto : null;
    const precio =
      variante && variante.precioVenta !== null && variante.precioVenta !== undefined
        ? Number(variante.precioVenta)
        : producto
          ? Number(producto.precioVenta)
          : 0;
    const cantidad = Number(item.cantidad) || 0;

    return {
      varianteId: item.varianteId,
      sku: variante ? variante.sku : null,
      nombreProducto: producto ? producto.nombre : 'Producto',
      nombreVariante: variante ? variante.nombre : null,
      atributos: variante ? variante.atributos : {},
      imagen:
        (variante && variante.imagenes && variante.imagenes[0]) ||
        (producto && (producto.imagenPrincipal || (producto.imagenes || [])[0])) ||
        null,
      cantidad,
      precioUnitario: round2(precio),
      subtotal: round2(precio * cantidad),
    };
  });

  const montos = calcularMontosLineas(lineas, opciones.metodoEntrega, opciones.configuracion);

  return { lineas, ...montos };
}

function calcularMontosLineas(lineas, metodoEntrega = 'domicilio', configuracion = null) {
  const subtotal = round2((lineas || []).reduce((sum, linea) => sum + linea.subtotal, 0));
  const esRetiro = normalizarMetodoEntrega(metodoEntrega) === 'retiro';
  const descuento = esRetiro
    ? empresaService.calcularDescuentoRetiro(subtotal, configuracion)
    : { porcentaje: 0, monto: 0 };
  const baseImponible = round2(Math.max(0, subtotal - descuento.monto));
  const impuestos = round2(baseImponible * tasaImpuesto());
  const total = round2(baseImponible + impuestos);

  return {
    subtotal,
    descuentoRetiro: descuento.monto,
    descuentoPorcentaje: descuento.porcentaje,
    baseImponible,
    impuestos,
    total,
  };
}

function normalizarMetodoEntrega(valor) {
  const texto = String(valor || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (['retiro', 'retiro-tienda', 'retiro_en_tienda', 'tienda', 'pickup'].includes(texto)) {
    return 'retiro';
  }
  return 'domicilio';
}

async function resolverEntrega(payload = {}) {
  const metodoEntrega = normalizarMetodoEntrega(
    payload.metodoEntrega || payload.tipoEntrega || payload.formaEntrega
  );

  if (metodoEntrega !== 'retiro') {
    return { metodoEntrega, sucursal: null };
  }

  const sucursalId = Number(payload.sucursalId || payload.sucursal || 0);
  if (!Number.isInteger(sucursalId) || sucursalId <= 0) {
    throw new AppError('Selecciona una sucursal activa para el retiro en tienda', 400, [
      { field: 'sucursalId', message: 'La sucursal de retiro es obligatoria' },
    ]);
  }

  const sucursal = await Sucursal.findOne({ where: { id: sucursalId, activa: true } });
  if (!sucursal) {
    throw new AppError('La sucursal seleccionada no está activa o no existe', 404, [
      { field: 'sucursalId', message: 'Selecciona una sucursal habilitada' },
    ]);
  }

  return { metodoEntrega, sucursal };
}

function datosEntregaDesdeSucursal(sucursal, usuario, notas = null) {
  const notaRetiro = `Retiro en tienda: ${sucursal.nombre}. Horarios: ${
    sucursal.horarios || 'consultar'
  }.`;
  const notaFinal = [notaRetiro, notas].filter(Boolean).join(' ').slice(0, 500);

  return {
    nombreDestinatario: String(usuario && usuario.nombre ? usuario.nombre : 'Cliente BytePro')
      .trim()
      .slice(0, 160),
    direccion: String(sucursal.direccion || '').slice(0, 255),
    ciudad: String(sucursal.ciudad || '').slice(0, 100),
    telefono: String(
      sucursal.telefono || (usuario && usuario.telefono) || '0000000'
    ).slice(0, 40),
    notas: notaFinal,
  };
}

function datosEntregaDesdeCheckout(checkout) {
  return {
    nombreDestinatario: checkout.nombreDestinatario || null,
    direccion: checkout.direccion || null,
    ciudad: checkout.ciudad || null,
    telefono: checkout.telefono || null,
    notas: checkout.notas || null,
  };
}

function snapshotSucursal(sucursal) {
  if (!sucursal) {
    return {
      sucursalId: null,
      sucursalNombre: null,
      sucursalCiudad: null,
      sucursalDireccion: null,
      sucursalTelefono: null,
      sucursalHorarios: null,
    };
  }
  return {
    sucursalId: sucursal.id,
    sucursalNombre: sucursal.nombre,
    sucursalCiudad: sucursal.ciudad,
    sucursalDireccion: sucursal.direccion,
    sucursalTelefono: sucursal.telefono,
    sucursalHorarios: sucursal.horarios,
  };
}

async function cargarCarritoActivo(usuarioId) {
  const carrito = await Carrito.findOne({
    where: { usuarioId, estado: 'activo' },
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

  if (!carrito || !carrito.items || carrito.items.length === 0) {
    throw new AppError('Tu carrito está vacío', 400);
  }

  return carrito;
}

async function stockFisico(varianteId) {
  const inventario = await Inventario.findOne({ where: { varianteId } });
  return inventario ? Number(inventario.cantidad) || 0 : 0;
}

async function unidadesBloqueadas(varianteId, excluirCheckoutId = null) {
  const where = {
    varianteId,
    estado: 'activo',
    expiraEn: { [Op.gt]: new Date() },
  };
  if (excluirCheckoutId) {
    where.checkoutId = { [Op.ne]: excluirCheckoutId };
  }
  const total = await BloqueoStock.sum('cantidad', { where });
  return Number(total) || 0;
}

async function stockDisponible(varianteId, excluirCheckoutId = null) {
  const fisico = await stockFisico(varianteId);
  const bloqueado = await unidadesBloqueadas(varianteId, excluirCheckoutId);
  return Math.max(0, fisico - bloqueado);
}

async function liberarBloqueosExpirados() {
  const ahora = new Date();

  await sequelize.transaction(async (transaction) => {
    const expirados = await BloqueoStock.findAll({
      where: { estado: 'activo', expiraEn: { [Op.lt]: ahora } },
      include: [
        {
          model: Checkout,
          as: 'checkout',
          attributes: ['id', 'ventaId', 'usuarioId'],
        },
      ],
      transaction,
    });

    const grupos = new Map();
    for (const bloqueo of expirados) {
      const key = bloqueo.checkoutId;
      if (!grupos.has(key)) {
        grupos.set(key, {
          ventaId: bloqueo.checkout ? bloqueo.checkout.ventaId : null,
          usuarioId: bloqueo.checkout ? bloqueo.checkout.usuarioId : null,
          items: [],
        });
      }
      grupos.get(key).items.push({
        varianteId: bloqueo.varianteId,
        cantidad: Number(bloqueo.cantidad),
      });
    }

    for (const [checkoutId, grupo] of grupos) {
      await almacenService.registrarLiberacion({
        checkoutId,
        ventaId: grupo.ventaId,
        items: grupo.items,
        usuarioId: grupo.usuarioId,
        motivo: 'Liberación por expiración de la reserva temporal',
        transaction,
      });
    }

    if (expirados.length) {
      await BloqueoStock.update(
        { estado: 'expirado' },
        {
          where: { id: expirados.map((bloqueo) => bloqueo.id) },
          transaction,
        }
      );
    }

    await Checkout.update(
      { estado: 'expirado' },
      {
        where: { estado: 'abierto', expiraEn: { [Op.lt]: ahora } },
        transaction,
      }
    );
  });
}

async function validarDisponibilidad(lineas, excluirCheckoutId = null) {
  const conflictos = [];
  for (const linea of lineas) {
    const disponible = await stockDisponible(linea.varianteId, excluirCheckoutId);
    if (disponible < linea.cantidad) {
      conflictos.push({
        varianteId: linea.varianteId,
        nombreProducto: linea.nombreProducto,
        solicitado: linea.cantidad,
        disponible,
      });
    }
  }

  if (conflictos.length > 0) {
    throw new AppError(
      'No hay stock suficiente para completar el checkout. Ajusta las cantidades e inténtalo de nuevo.',
      409,
      conflictos
    );
  }
}

function serializarCheckout(checkout, venta, lineas, direccionesGuardadas = [], extra = {}) {
  const sucursal = checkout.sucursalId
    ? {
        id: checkout.sucursalId,
        nombre: checkout.sucursalNombre,
        ciudad: checkout.sucursalCiudad,
        direccion: checkout.sucursalDireccion,
        telefono: checkout.sucursalTelefono,
        horarios: checkout.sucursalHorarios,
      }
    : null;

  return {
    checkoutId: checkout.id,
    ventaId: venta.id,
    estado: checkout.estado,
    moneda: checkout.moneda,
    subtotal: Number(checkout.subtotal),
    descuentoRetiro: Number(checkout.descuentoRetiro) || 0,
    descuentoPorcentaje: Number(checkout.descuentoPorcentaje) || 0,
    baseImponible: round2(
      Number(checkout.subtotal) - (Number(checkout.descuentoRetiro) || 0)
    ),
    impuestos: Number(checkout.impuestos),
    total: Number(checkout.total),
    metodoEntrega: checkout.metodoEntrega || 'domicilio',
    sucursal,
    sucursales: extra.sucursales || [],
    configuracionRetiro: extra.configuracionRetiro || null,
    expiraEn: checkout.expiraEn,
    segundosRestantes: Math.max(
      0,
      Math.floor((new Date(checkout.expiraEn).getTime() - Date.now()) / 1000)
    ),
    datosEntrega: {
      nombreDestinatario: checkout.nombreDestinatario || null,
      destinatario: checkout.nombreDestinatario || null,
      direccion: checkout.direccion || null,
      direccionExacta: checkout.direccion || null,
      ciudad: checkout.ciudad || null,
      telefono: checkout.telefono || null,
      notas: checkout.notas || null,
    },
    direccionesGuardadas,
    ciudadesCobertura: distribucionService.CIUDADES_COBERTURA,
    items: lineas.map(serializarLinea),
    metodosPago: METODOS_PAGO,
  };
}

async function crearCheckout(usuario, payload = {}) {
  await liberarBloqueosExpirados();

  const { metodoEntrega, sucursal } = await resolverEntrega(payload || {});
  const configuracion = await empresaService.obtenerConfiguracion();
  const sucursales = await empresaService.listarSucursalesActivas();

  const datosEntrega =
    metodoEntrega === 'retiro'
      ? datosEntregaDesdeSucursal(sucursal, usuario, payload.notas)
      : await distribucionService.resolverDatosEntrega({
          usuario,
          payload: payload || {},
        });

  const extra = {
    sucursales,
    configuracionRetiro: {
      descuentoRetiroAlto: configuracion.descuentoRetiroAlto,
      descuentoRetiroBajo: configuracion.descuentoRetiroBajo,
      umbralDescuentoRetiro: configuracion.umbralDescuentoRetiro,
    },
  };
  const snapshot = snapshotSucursal(sucursal);

  const direcciones = await Direccion.findAll({
    where: { usuarioId: usuario.id },
    order: [
      ['predeterminada', 'DESC'],
      ['id', 'DESC'],
    ],
  });
  const direccionesGuardadas = direcciones.map((d) => ({
    id: d.id,
    etiqueta: d.etiqueta,
    alias: d.etiqueta,
    nombreDestinatario: d.nombreDestinatario,
    destinatario: d.nombreDestinatario,
    calle: d.calle,
    direccion: d.calle,
    ciudad: d.ciudad,
    telefono: d.telefono,
    referencias: d.referencias,
    notas: d.referencias,
    predeterminada: Boolean(d.predeterminada),
  }));

  const carrito = await cargarCarritoActivo(usuario.id);
  const totales = calcularTotales(carrito.items, {
    metodoEntrega,
    configuracion,
  });

  const existente = await Checkout.findOne({
    where: {
      carritoId: carrito.id,
      usuarioId: usuario.id,
      estado: 'abierto',
      expiraEn: { [Op.gt]: new Date() },
    },
    include: [{ model: Venta, as: 'venta' }],
    order: [['id', 'DESC']],
  });

  await validarDisponibilidad(
    totales.lineas,
    existente && existente.venta && existente.venta.estado === 'pendiente'
      ? existente.id
      : null
  );

  const expiraEn = new Date(Date.now() + minutosBloqueo() * 60 * 1000);
  let data = null;

  await sequelize.transaction(async (transaction) => {
    let venta = null;
    let checkout = null;

    if (existente && existente.venta && existente.venta.estado === 'pendiente') {
      checkout = await Checkout.findByPk(existente.id, { transaction });
      venta = await Venta.findByPk(checkout.ventaId, { transaction });

      const bloqueosPrevios = await BloqueoStock.findAll({
        where: { checkoutId: checkout.id, estado: 'activo' },
        transaction,
      });

      await checkout.update(
        {
          subtotal: totales.subtotal,
          descuentoRetiro: totales.descuentoRetiro,
          descuentoPorcentaje: totales.descuentoPorcentaje,
          impuestos: totales.impuestos,
          total: totales.total,
          moneda: env.currency,
          estado: 'abierto',
          expiraEn,
          metodoEntrega,
          ...snapshot,
          nombreDestinatario: datosEntrega.nombreDestinatario,
          direccion: datosEntrega.direccion,
          ciudad: datosEntrega.ciudad,
          telefono: datosEntrega.telefono,
          notas: datosEntrega.notas,
        },
        { transaction }
      );
      await venta.update({ total: totales.total, estado: 'pendiente' }, { transaction });
      await CheckoutItem.destroy({ where: { checkoutId: checkout.id }, transaction });
      await VentaItem.destroy({ where: { ventaId: venta.id }, transaction });

      if (bloqueosPrevios.length) {
        await almacenService.registrarLiberacion({
          checkoutId: checkout.id,
          ventaId: venta.id,
          items: bloqueosPrevios.map((bloqueo) => ({
            varianteId: bloqueo.varianteId,
            cantidad: Number(bloqueo.cantidad),
          })),
          usuarioId: usuario.id,
          motivo: 'Liberación por renovación de la reserva temporal',
          transaction,
        });
      }

      await BloqueoStock.destroy({ where: { checkoutId: checkout.id }, transaction });
    } else {
      if (existente) {
        const bloqueosAnteriores = await BloqueoStock.findAll({
          where: { checkoutId: existente.id, estado: 'activo' },
          transaction,
        });

        await Checkout.update(
          { estado: 'fallido' },
          { where: { id: existente.id }, transaction }
        );

        if (bloqueosAnteriores.length) {
          await almacenService.registrarLiberacion({
            checkoutId: existente.id,
            ventaId: existente.ventaId,
            items: bloqueosAnteriores.map((bloqueo) => ({
              varianteId: bloqueo.varianteId,
              cantidad: Number(bloqueo.cantidad),
            })),
            usuarioId: usuario.id,
            motivo: 'Liberación por cierre de checkout anterior',
            transaction,
          });
        }

        await BloqueoStock.update(
          { estado: 'liberado' },
          { where: { checkoutId: existente.id, estado: 'activo' }, transaction }
        );
      }

      venta = await Venta.create(
        { usuarioId: usuario.id, total: totales.total, estado: 'pendiente' },
        { transaction }
      );
      checkout = await Checkout.create(
        {
          usuarioId: usuario.id,
          carritoId: carrito.id,
          ventaId: venta.id,
          subtotal: totales.subtotal,
          descuentoRetiro: totales.descuentoRetiro,
          descuentoPorcentaje: totales.descuentoPorcentaje,
          impuestos: totales.impuestos,
          total: totales.total,
          moneda: env.currency,
          estado: 'abierto',
          expiraEn,
          metodoEntrega,
          ...snapshot,
          nombreDestinatario: datosEntrega.nombreDestinatario,
          direccion: datosEntrega.direccion,
          ciudad: datosEntrega.ciudad,
          telefono: datosEntrega.telefono,
          notas: datosEntrega.notas,
        },
        { transaction }
      );
    }

    for (const linea of totales.lineas) {
      await CheckoutItem.create(
        {
          checkoutId: checkout.id,
          varianteId: linea.varianteId,
          cantidad: linea.cantidad,
          precioUnitario: linea.precioUnitario,
          subtotal: linea.subtotal,
          nombreProducto: linea.nombreProducto,
          nombreVariante: linea.nombreVariante,
          sku: linea.sku,
        },
        { transaction }
      );

      await VentaItem.create(
        {
          ventaId: venta.id,
          varianteId: linea.varianteId,
          cantidad: linea.cantidad,
          precioUnitario: linea.precioUnitario,
        },
        { transaction }
      );

      await BloqueoStock.create(
        {
          checkoutId: checkout.id,
          varianteId: linea.varianteId,
          cantidad: linea.cantidad,
          expiraEn,
          estado: 'activo',
        },
        { transaction }
      );
    }

    await almacenService.registrarReserva({
      checkoutId: checkout.id,
      ventaId: venta.id,
      items: totales.lineas,
      usuarioId: usuario.id,
      transaction,
    });

    data = serializarCheckout(
      checkout,
      venta,
      totales.lineas,
      direccionesGuardadas,
      extra
    );
  });

  return data;
}

async function actualizarEntrega(usuario, payload = {}) {
  const ventaId = Number(payload.ventaId || payload.venta || 0);
  if (!Number.isInteger(ventaId) || ventaId <= 0) {
    throw new AppError('Se requiere el identificador de la venta', 400);
  }

  const checkout = await Checkout.findOne({
    where: { ventaId },
    include: [{ model: Venta, as: 'venta' }],
  });

  if (!checkout) {
    throw new AppError('Sesión de checkout no encontrada', 404);
  }
  if (Number(checkout.usuarioId) !== Number(usuario.id)) {
    throw new AppError('No tienes permisos para modificar esta orden', 403);
  }
  if (checkout.estado !== 'abierto' || !checkout.venta || checkout.venta.estado !== 'pendiente') {
    throw new AppError('La orden ya no está disponible para modificar la entrega', 409);
  }

  const { metodoEntrega, sucursal } = await resolverEntrega(payload);
  const configuracion = await empresaService.obtenerConfiguracion();
  const sucursales = await empresaService.listarSucursalesActivas();

  const items = await CheckoutItem.findAll({
    where: { checkoutId: checkout.id },
    order: [['id', 'ASC']],
  });
  if (!items.length) {
    throw new AppError('La sesión de checkout no tiene ítems', 409);
  }

  const lineas = items.map((item) => ({
    varianteId: item.varianteId,
    sku: item.sku,
    nombreProducto: item.nombreProducto,
    nombreVariante: item.nombreVariante,
    cantidad: Number(item.cantidad),
    precioUnitario: Number(item.precioUnitario),
    subtotal: Number(item.subtotal),
  }));

  const totales = calcularMontosLineas(lineas, metodoEntrega, configuracion);

  let datosEntrega;
  if (metodoEntrega === 'retiro') {
    datosEntrega = datosEntregaDesdeSucursal(
      sucursal,
      usuario,
      payload.notas || checkout.notas
    );
  } else {
    datosEntrega = await distribucionService.resolverDatosEntrega({
      usuario,
      payload: payload || {},
      checkout: checkout.metodoEntrega === 'domicilio' ? checkout : null,
    });
  }

  await checkout.update({
    subtotal: totales.subtotal,
    descuentoRetiro: totales.descuentoRetiro,
    descuentoPorcentaje: totales.descuentoPorcentaje,
    impuestos: totales.impuestos,
    total: totales.total,
    metodoEntrega,
    ...snapshotSucursal(sucursal),
    nombreDestinatario: datosEntrega.nombreDestinatario,
    direccion: datosEntrega.direccion,
    ciudad: datosEntrega.ciudad,
    telefono: datosEntrega.telefono,
    notas: datosEntrega.notas,
  });

  await checkout.venta.update({ total: totales.total });

  const direcciones = await Direccion.findAll({
    where: { usuarioId: usuario.id },
    order: [
      ['predeterminada', 'DESC'],
      ['id', 'DESC'],
    ],
  });
  const direccionesGuardadas = direcciones.map((d) => ({
    id: d.id,
    etiqueta: d.etiqueta,
    alias: d.etiqueta,
    nombreDestinatario: d.nombreDestinatario,
    destinatario: d.nombreDestinatario,
    calle: d.calle,
    direccion: d.calle,
    ciudad: d.ciudad,
    telefono: d.telefono,
    referencias: d.referencias,
    notas: d.referencias,
    predeterminada: Boolean(d.predeterminada),
  }));

  return serializarCheckout(checkout, checkout.venta, lineas, direccionesGuardadas, {
    sucursales,
    configuracionRetiro: {
      descuentoRetiroAlto: configuracion.descuentoRetiroAlto,
      descuentoRetiroBajo: configuracion.descuentoRetiroBajo,
      umbralDescuentoRetiro: configuracion.umbralDescuentoRetiro,
    },
  });
}

function validarDatosPago(metodo, datosPago) {
  const datos = datosPago && typeof datosPago === 'object' ? datosPago : {};
  const simulacion = ['aprobado', 'fondos', 'fraude', 'red', 'discrepancia'].includes(
    datos.simulacion
  )
    ? datos.simulacion
    : 'aprobado';

  if (metodo === 'tarjeta') {
    if (datos.numeroTarjeta || datos.numero || datos.pan || datos.cvv || datos.cvv2) {
      throw new AppError(
        'Los datos de la tarjeta deben enviarse tokenizados. No envíes el número completo ni el CVV.',
        400
      );
    }
    if (!isValidToken(datos.tokenTarjeta)) {
      throw new AppError('Token de tarjeta inválido o ausente', 400, [
        { field: 'tokenTarjeta', message: 'Tokeniza la tarjeta antes de enviar el pago' },
      ]);
    }
    const ultimos4 = String(datos.ultimos4 || '');
    if (!/^\d{4}$/.test(ultimos4)) {
      throw new AppError('Los últimos 4 dígitos de la tarjeta son inválidos', 400, [
        { field: 'ultimos4', message: 'Debe contener exactamente 4 dígitos' },
      ]);
    }
    return {
      simulacion,
      tokenTarjeta: datos.tokenTarjeta,
      ultimos4,
      marca: datos.marca ? String(datos.marca).slice(0, 30) : null,
      titular: datos.titular ? String(datos.titular).slice(0, 120) : null,
    };
  }

  if (metodo === 'transferencia') {
    const referencia = String(
      datos.referenciaComprobante || datos.referencia || datos.comprobante || ''
    ).trim();
    if (referencia.length < 4 || referencia.length > 120) {
      throw new AppError(
        'Ingresa la referencia o número de comprobante de la transferencia (4 a 120 caracteres)',
        400,
        [{ field: 'referenciaComprobante' }]
      );
    }
    return {
      simulacion,
      referenciaComprobante: referencia,
      titular: datos.titular ? String(datos.titular).slice(0, 120) : null,
    };
  }

  const proveedor = ['stripe', 'paypal', 'sandbox'].includes(datos.proveedor)
    ? datos.proveedor
    : 'sandbox';
  if (!isValidTokenPasarela(datos.tokenPasarela)) {
    throw new AppError('Token de pasarela inválido o ausente', 400, [
      { field: 'tokenPasarela', message: 'La pasarela debe entregar un token antes del cobro' },
    ]);
  }
  return { simulacion, tokenPasarela: datos.tokenPasarela, proveedor };
}

function serializarResultadoAprobado({
  venta,
  checkout,
  transaccion,
  recibo,
  despacho,
  email,
  idempotente,
}) {
  return {
    idempotente: Boolean(idempotente),
    venta: {
      id: venta.id,
      estado: venta.estado,
      total: Number(venta.total),
    },
    checkout: {
      id: checkout.id,
      subtotal: Number(checkout.subtotal),
      descuentoRetiro: Number(checkout.descuentoRetiro) || 0,
      descuentoPorcentaje: Number(checkout.descuentoPorcentaje) || 0,
      baseImponible: round2(
        Number(checkout.subtotal) - (Number(checkout.descuentoRetiro) || 0)
      ),
      impuestos: Number(checkout.impuestos),
      total: Number(checkout.total),
      moneda: checkout.moneda,
      metodoEntrega: checkout.metodoEntrega || 'domicilio',
      sucursal: checkout.sucursalNombre
        ? {
            id: checkout.sucursalId,
            nombre: checkout.sucursalNombre,
            ciudad: checkout.sucursalCiudad,
            direccion: checkout.sucursalDireccion,
            telefono: checkout.sucursalTelefono,
            horarios: checkout.sucursalHorarios,
          }
        : null,
      datosEntrega: {
        nombreDestinatario: checkout.nombreDestinatario || null,
        direccion: checkout.direccion || null,
        ciudad: checkout.ciudad || null,
        telefono: checkout.telefono || null,
        notas: checkout.notas || null,
      },
    },
    transaccion: serializarTransaccion(transaccion),
    recibo: serializarRecibo(recibo),
    despacho: distribucionService.serializarDespacho(despacho),
    email: email || null,
  };
}

async function responderIdempotente(previa, checkout) {
  if (previa.estado === 'aprobado') {
    const recibo = previa.recibo || (await Recibo.findOne({ where: { transaccionId: previa.id } }));
    const despacho = await Despacho.findOne({ where: { ventaId: previa.ventaId } });
    const venta = (checkout && checkout.venta) || (await Venta.findByPk(previa.ventaId));
    return serializarResultadoAprobado({
      venta,
      checkout,
      transaccion: previa,
      recibo,
      despacho,
      email: null,
      idempotente: true,
    });
  }

  if (previa.estado === 'rechazado') {
    const motivo = previa.motivoRechazo || 'Pago rechazado';
    throw new AppError(
      `${motivo}. La orden sigue pendiente de pago; puedes reintentar con otro método.`,
      402,
      {
        estado: 'rechazado',
        ventaEstado: 'pendiente',
        codigoTransaccion: previa.codigoTransaccion,
        ventaId: previa.ventaId,
        metodo: previa.metodo,
      }
    );
  }

  if (previa.estado === 'discrepancia') {
    throw new AppError(
      'Discrepancia en el monto cobrado. La orden quedó pendiente para conciliación manual.',
      409,
      {
        estado: 'discrepancia',
        ventaEstado: 'pendiente',
        codigoTransaccion: previa.codigoTransaccion,
        ventaId: previa.ventaId,
        metodo: previa.metodo,
      }
    );
  }

  throw new AppError('La transacción sigue pendiente de confirmación', 409);
}

async function procesarPago({
  usuario,
  ventaId,
  idempotencyKey,
  metodo,
  datosPago,
  direccionEntrega,
  payload = {},
}) {
  const metodoInfo = METODOS_PAGO.find((item) => item.id === metodo);
  if (!metodoInfo) {
    throw new AppError('Método de pago no soportado', 400);
  }

  const key = String(idempotencyKey || '').trim();
  if (key.length < 8 || key.length > 120) {
    throw new AppError('Se requiere una Idempotency-Key válida de 8 a 120 caracteres', 400);
  }

  const checkout = await Checkout.findOne({
    where: { ventaId },
    include: [{ model: Venta, as: 'venta' }],
  });

  if (!checkout) {
    throw new AppError('Sesión de checkout no encontrada', 404);
  }
  if (Number(checkout.usuarioId) !== Number(usuario.id)) {
    throw new AppError('No tienes permisos para pagar esta orden', 403);
  }

  const previa = await Transaccion.findOne({
    where: { idempotencyKey: key },
    include: [{ model: Recibo, as: 'recibo' }],
  });

  if (previa) {
    if (Number(previa.ventaId) !== Number(checkout.ventaId)) {
      throw new AppError(
        'La clave de idempotencia ya fue utilizada para otra orden',
        409
      );
    }
    return responderIdempotente(previa, checkout);
  }

  if (checkout.estado === 'pagado') {
    const aprobada = await Transaccion.findOne({
      where: { ventaId: checkout.ventaId, estado: 'aprobado' },
      include: [{ model: Recibo, as: 'recibo' }],
    });
    if (aprobada) return responderIdempotente(aprobada, checkout);
    throw new AppError('La orden ya fue pagada', 409);
  }

  if (checkout.estado === 'expirado' || new Date(checkout.expiraEn) <= new Date()) {
    await liberarBloqueosExpirados();
    throw new AppError(
      'El bloqueo temporal de stock expiró. Vuelve a iniciar el checkout para reservar nuevamente.',
      409
    );
  }

  if (!checkout.venta || checkout.venta.estado !== 'pendiente') {
    throw new AppError('La orden no está disponible para pago', 409);
  }

  // [REQ-DIS-03] Validar dirección de entrega antes de procesar el pago.
  // [REQ-RET-01] En retiro en tienda se usa la sucursal seleccionada, no una dirección domiciliaria.
  const datosEntrega =
    normalizarMetodoEntrega(checkout.metodoEntrega) === 'retiro'
      ? datosEntregaDesdeCheckout(checkout)
      : await distribucionService.resolverDatosEntrega({
          usuario,
          payload: {
            ...(datosPago && typeof datosPago === 'object' ? datosPago : {}),
            ...(payload && typeof payload === 'object' ? payload : {}),
            ...(direccionEntrega ? { direccionEntrega } : {}),
          },
          checkout,
        });

  const datos = validarDatosPago(metodo, datosPago);

  const itemsCheckout = await CheckoutItem.findAll({
    where: { checkoutId: checkout.id },
    order: [['id', 'ASC']],
  });

  if (itemsCheckout.length === 0) {
    throw new AppError('La sesión de checkout no tiene ítems', 409);
  }

  // [REQ-RET-03] Recalcular el descuento dinámico con la configuración vigente
  // justo antes de liquidar y confirmar el checkout.
  const configuracion = await empresaService.obtenerConfiguracion();
  const lineas = itemsCheckout.map((item) => ({
    varianteId: item.varianteId,
    sku: item.sku,
    nombreProducto: item.nombreProducto,
    nombreVariante: item.nombreVariante,
    cantidad: Number(item.cantidad),
    precioUnitario: Number(item.precioUnitario),
    subtotal: Number(item.subtotal),
  }));
  const totales = calcularMontosLineas(lineas, checkout.metodoEntrega, configuracion);

  if (
    toCents(totales.subtotal) !== toCents(checkout.subtotal) ||
    toCents(totales.descuentoRetiro) !== toCents(checkout.descuentoRetiro || 0) ||
    toCents(totales.impuestos) !== toCents(checkout.impuestos) ||
    toCents(totales.total) !== toCents(checkout.total)
  ) {
    await checkout.update({
      subtotal: totales.subtotal,
      descuentoRetiro: totales.descuentoRetiro,
      descuentoPorcentaje: totales.descuentoPorcentaje,
      impuestos: totales.impuestos,
      total: totales.total,
    });
    if (checkout.venta) {
      await checkout.venta.update({ total: totales.total });
    }
  }

  const bloqueosActivos = await BloqueoStock.count({
    where: {
      checkoutId: checkout.id,
      estado: 'activo',
      expiraEn: { [Op.gt]: new Date() },
    },
  });

  if (bloqueosActivos === 0) {
    const conflictos = [];
    for (const item of itemsCheckout) {
      const disponible = await stockDisponible(item.varianteId, checkout.id);
      if (disponible < Number(item.cantidad)) {
        conflictos.push({
          varianteId: item.varianteId,
          nombreProducto: item.nombreProducto,
          solicitado: Number(item.cantidad),
          disponible,
        });
      }
    }

    if (conflictos.length > 0) {
      throw new AppError(
        'No hay stock suficiente para reintentar el pago. Ajusta tu carrito.',
        409,
        conflictos
      );
    }

    const nuevaExpiracion = new Date(Date.now() + minutosBloqueo() * 60 * 1000);
    await sequelize.transaction(async (transaction) => {
      await BloqueoStock.bulkCreate(
        itemsCheckout.map((item) => ({
          checkoutId: checkout.id,
          varianteId: item.varianteId,
          cantidad: item.cantidad,
          expiraEn: nuevaExpiracion,
          estado: 'activo',
        })),
        { transaction }
      );
      await almacenService.registrarReserva({
        checkoutId: checkout.id,
        ventaId: checkout.ventaId,
        items: itemsCheckout.map((item) => ({
          varianteId: item.varianteId,
          cantidad: Number(item.cantidad),
        })),
        usuarioId: usuario.id,
        motivo: 'Reserva renovada al reintentar el pago',
        transaction,
      });
      await checkout.update({ expiraEn: nuevaExpiracion }, { transaction });
    });
  }

  const resultado = await pasarelaService.procesar({
    metodo,
    monto: Number(checkout.total),
    moneda: checkout.moneda,
    datosPago: datos,
    ventaId: checkout.ventaId,
    usuario,
  });

  if (
    resultado.estado === 'aprobado' &&
    toCents(resultado.montoCobrado) !== toCents(checkout.total)
  ) {
    resultado.estado = 'discrepancia';
    resultado.motivoRechazo = 'El monto cobrado no coincide con el total de la orden';
  }

  let desenlace = null;

  await sequelize.transaction(async (transaction) => {
    const transaccion = await Transaccion.create(
      {
        ventaId: checkout.ventaId,
        checkoutId: checkout.id,
        usuarioId: usuario.id,
        codigoTransaccion: resultado.codigoTransaccion,
        idempotencyKey: key,
        metodo,
        proveedor: resultado.proveedor,
        monto: checkout.total,
        moneda: checkout.moneda,
        estado:
          resultado.estado === 'discrepancia'
            ? 'discrepancia'
            : resultado.estado === 'rechazado'
              ? 'rechazado'
              : 'aprobado',
        motivoRechazo: resultado.motivoRechazo || null,
        referenciaExterna: resultado.referenciaExterna,
        tokenPago: datos.tokenTarjeta || datos.tokenPasarela || null,
        ultimos4: datos.ultimos4 || null,
        marcaTarjeta: datos.marca || null,
        montoPasarela: resultado.montoCobrado,
        payloadRespuesta: resultado.payload,
        fechaProcesado: new Date(),
      },
      { transaction }
    );

    if (resultado.estado === 'discrepancia') {
      const bloqueosActivos = await BloqueoStock.findAll({
        where: { checkoutId: checkout.id, estado: 'activo' },
        transaction,
      });
      if (bloqueosActivos.length) {
        await almacenService.registrarLiberacion({
          checkoutId: checkout.id,
          ventaId: checkout.ventaId,
          items: bloqueosActivos.map((bloqueo) => ({
            varianteId: bloqueo.varianteId,
            cantidad: Number(bloqueo.cantidad),
          })),
          usuarioId: usuario.id,
          motivo: 'Liberación por discrepancia en el monto cobrado',
          transaction,
        });
      }
      await BloqueoStock.update(
        { estado: 'liberado' },
        { where: { checkoutId: checkout.id, estado: 'activo' }, transaction }
      );
      await checkout.update(
        { estado: 'abierto', ultimoIntentoEn: new Date() },
        { transaction }
      );
      await auditoriaService.registrar({
        tipo: 'discrepancia_monto',
        severidad: 'critica',
        mensaje: `Discrepancia de monto en la venta #${checkout.ventaId}: esperado ${formatearMonto(
          checkout.total,
          checkout.moneda
        )}, cobrado ${formatearMonto(resultado.montoCobrado, checkout.moneda)}`,
        ventaId: checkout.ventaId,
        transaccionId: transaccion.id,
        usuarioId: usuario.id,
        payload: {
          esperado: Number(checkout.total),
          cobrado: Number(resultado.montoCobrado),
          metodo,
          codigoTransaccion: transaccion.codigoTransaccion,
        },
        transaction,
      });
      desenlace = { tipo: 'discrepancia', transaccion };
      return;
    }

    if (resultado.estado === 'rechazado') {
      const bloqueosActivos = await BloqueoStock.findAll({
        where: { checkoutId: checkout.id, estado: 'activo' },
        transaction,
      });
      if (bloqueosActivos.length) {
        await almacenService.registrarLiberacion({
          checkoutId: checkout.id,
          ventaId: checkout.ventaId,
          items: bloqueosActivos.map((bloqueo) => ({
            varianteId: bloqueo.varianteId,
            cantidad: Number(bloqueo.cantidad),
          })),
          usuarioId: usuario.id,
          motivo: 'Liberación por rechazo del pago',
          transaction,
        });
      }
      await BloqueoStock.update(
        { estado: 'liberado' },
        { where: { checkoutId: checkout.id, estado: 'activo' }, transaction }
      );
      await checkout.update(
        { estado: 'abierto', ultimoIntentoEn: new Date() },
        { transaction }
      );
      desenlace = { tipo: 'rechazado', transaccion };
      return;
    }

    for (const item of itemsCheckout) {
      const inventario = await Inventario.findOne({
        where: { varianteId: item.varianteId },
        transaction,
      });
      if (!inventario || Number(inventario.cantidad) < Number(item.cantidad)) {
        const motivo = `Stock insuficiente para ${
          item.nombreProducto || 'un producto'
        } al confirmar el pago`;
        await transaccion.update(
          { estado: 'rechazado', motivoRechazo: motivo },
          { transaction }
        );
        const bloqueosActivos = await BloqueoStock.findAll({
          where: { checkoutId: checkout.id, estado: 'activo' },
          transaction,
        });
        if (bloqueosActivos.length) {
          await almacenService.registrarLiberacion({
            checkoutId: checkout.id,
            ventaId: checkout.ventaId,
            items: bloqueosActivos.map((bloqueo) => ({
              varianteId: bloqueo.varianteId,
              cantidad: Number(bloqueo.cantidad),
            })),
            usuarioId: usuario.id,
            motivo: 'Liberación por stock insuficiente al confirmar el pago',
            transaction,
          });
        }
        await BloqueoStock.update(
          { estado: 'liberado' },
          { where: { checkoutId: checkout.id, estado: 'activo' }, transaction }
        );
        await checkout.update(
          { estado: 'abierto', ultimoIntentoEn: new Date() },
          { transaction }
        );
        desenlace = { tipo: 'rechazado', transaccion };
        return;
      }
    }

    await almacenService.registrarSalidaVenta({
      checkoutId: checkout.id,
      ventaId: checkout.ventaId,
      items: itemsCheckout.map((item) => ({
        varianteId: item.varianteId,
        cantidad: Number(item.cantidad),
      })),
      usuarioId: usuario.id,
      transaction,
    });

    await BloqueoStock.update(
      { estado: 'consumido' },
      { where: { checkoutId: checkout.id, estado: 'activo' }, transaction }
    );
    await checkout.update(
      {
        estado: 'pagado',
        ultimoIntentoEn: new Date(),
        nombreDestinatario: datosEntrega.nombreDestinatario,
        direccion: datosEntrega.direccion,
        ciudad: datosEntrega.ciudad,
        telefono: datosEntrega.telefono,
        notas: datosEntrega.notas,
      },
      { transaction }
    );

    const venta = await Venta.findByPk(checkout.ventaId, { transaction });
    await venta.update({ estado: 'pagada', total: checkout.total }, { transaction });

    const carrito = await Carrito.findByPk(checkout.carritoId, { transaction });
    if (carrito) {
      await carrito.update({ estado: 'convertido' }, { transaction });
    }

    const recibo = await reciboService.generarRecibo({
      venta,
      checkout,
      transaccion,
      lineas,
      usuario,
      transaction,
    });

    await distribucionService.crearDespachoPago({
      venta,
      checkout,
      usuario,
      datosEntrega,
      transaction,
    });

    await auditoriaService.registrar({
      tipo: 'pago_aprobado',
      severidad: 'info',
      mensaje: `Pago aprobado para la venta #${venta.id}`,
      ventaId: venta.id,
      transaccionId: transaccion.id,
      usuarioId: usuario.id,
      payload: { metodo, total: Number(checkout.total) },
      transaction,
    });

    desenlace = { tipo: 'aprobado', transaccion, recibo };
  });

  if (desenlace.tipo === 'discrepancia') {
    throw new AppError(
      'Discrepancia en el monto cobrado. La orden quedó pendiente y se alertó al equipo de conciliación.',
      409,
      {
        estado: 'discrepancia',
        ventaEstado: 'pendiente',
        codigoTransaccion: desenlace.transaccion.codigoTransaccion,
        ventaId: checkout.ventaId,
        metodo,
        montoEsperado: Number(checkout.total),
        montoCobrado: Number(resultado.montoCobrado),
      }
    );
  }

  if (desenlace.tipo === 'rechazado') {
    const motivo = desenlace.transaccion.motivoRechazo || 'Pago rechazado';
    throw new AppError(
      `${motivo}. La orden sigue pendiente de pago; puedes reintentar con otro método.`,
      402,
      {
        estado: 'rechazado',
        ventaEstado: 'pendiente',
        codigoTransaccion: desenlace.transaccion.codigoTransaccion,
        ventaId: checkout.ventaId,
        metodo,
      }
    );
  }

  const venta = await Venta.findByPk(checkout.ventaId);
  const despacho = await Despacho.findOne({ where: { ventaId: checkout.ventaId } });

  let email = null;
  try {
    email = await emailService.enviarRecibo({ recibo: desenlace.recibo, usuario });
    await desenlace.recibo.update({ enviadoEn: new Date() });
  } catch (err) {
    console.warn(`[email] No se pudo simular el envío del recibo: ${err.message}`);
  }

  return serializarResultadoAprobado({
    venta,
    checkout,
    transaccion: desenlace.transaccion,
    recibo: desenlace.recibo,
    despacho,
    email,
    idempotente: false,
  });
}

async function obtenerVenta({ usuario, ventaId }) {
  const venta = await Venta.findByPk(ventaId, {
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
      { model: Checkout, as: 'checkout' },
      { model: Recibo, as: 'recibo' },
      { model: Despacho, as: 'despacho' },
      {
        model: Transaccion,
        as: 'transacciones',
        include: [{ model: Recibo, as: 'recibo' }],
      },
    ],
  });

  if (!venta) {
    throw new AppError('Venta no encontrada', 404);
  }

  const esPropietario = Number(venta.usuarioId) === Number(usuario.id);
  if (!esPropietario && !STAFF_ROLES.includes(usuario.rol)) {
    throw new AppError('No tienes permisos para ver esta venta', 403);
  }

  const transacciones = (venta.transacciones || [])
    .slice()
    .sort((a, b) => b.id - a.id)
    .map((transaccion) => ({
      ...serializarTransaccion(transaccion),
      recibo: transaccion.recibo
        ? { id: transaccion.recibo.id, numero: transaccion.recibo.numero }
        : null,
    }));

  const despachoSerializado = distribucionService.serializarDespacho(venta.despacho);
  const estadoLogistico = despachoSerializado
    ? despachoSerializado.estado
    : venta.estado === 'cancelada' || venta.estado === 'CANCELADO'
      ? 'CANCELADO'
      : 'PEDIDO_CONFIRMADO';
  const puedeCancelar =
    venta.estado !== 'cancelada' &&
    venta.estado !== 'CANCELADO' &&
    ['PEDIDO_CONFIRMADO', 'PREPARANDO_PEDIDO', 'EN_PREPARACION'].includes(estadoLogistico);

  return {
    id: venta.id,
    numeroPedido: `PED-${String(venta.id).padStart(4, '0')}`,
    estado: venta.estado,
    estadoLogistica: estadoLogistico,
    pildora: distribucionService.etiquetaPildoraPedido(venta.estado, estadoLogistico),
    puedeCancelar,
    total: Number(venta.total),
    moneda: venta.checkout ? venta.checkout.moneda : env.currency,
    fecha: venta.createdAt,
    metodoPago:
      (venta.recibo && venta.recibo.metodo) ||
      (transacciones[0] && transacciones[0].metodo) ||
      null,
    items: (venta.items || []).map((item) => {
      const variante = item.variante;
      const producto = variante ? variante.producto : null;
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
        cantidad: Number(item.cantidad),
        precioUnitario: Number(item.precioUnitario),
        subtotal: round2(Number(item.precioUnitario) * Number(item.cantidad)),
      };
    }),
    checkout: venta.checkout
      ? {
          id: venta.checkout.id,
          estado: venta.checkout.estado,
          subtotal: Number(venta.checkout.subtotal),
          descuentoRetiro: Number(venta.checkout.descuentoRetiro) || 0,
          descuentoPorcentaje: Number(venta.checkout.descuentoPorcentaje) || 0,
          baseImponible: round2(
            Number(venta.checkout.subtotal) - (Number(venta.checkout.descuentoRetiro) || 0)
          ),
          impuestos: Number(venta.checkout.impuestos),
          total: Number(venta.checkout.total),
          moneda: venta.checkout.moneda,
          metodoEntrega: venta.checkout.metodoEntrega || 'domicilio',
          sucursal: venta.checkout.sucursalNombre
            ? {
                id: venta.checkout.sucursalId,
                nombre: venta.checkout.sucursalNombre,
                ciudad: venta.checkout.sucursalCiudad,
                direccion: venta.checkout.sucursalDireccion,
                telefono: venta.checkout.sucursalTelefono,
                horarios: venta.checkout.sucursalHorarios,
              }
            : null,
          expiraEn: venta.checkout.expiraEn,
          datosEntrega: {
            nombreDestinatario: venta.checkout.nombreDestinatario || null,
            direccion: venta.checkout.direccion || null,
            ciudad: venta.checkout.ciudad || null,
            telefono: venta.checkout.telefono || null,
            notas: venta.checkout.notas || null,
          },
        }
      : null,
    datosEntrega: despachoSerializado
      ? despachoSerializado.datosEntrega
      : venta.checkout
        ? {
            nombreDestinatario: venta.checkout.nombreDestinatario || null,
            direccion: venta.checkout.direccion || null,
            ciudad: venta.checkout.ciudad || null,
            telefono: venta.checkout.telefono || null,
            notas: venta.checkout.notas || null,
          }
        : null,
    transacciones,
    recibo: serializarRecibo(venta.recibo),
    despacho: despachoSerializado,
  };
}

async function obtenerRecibo({ usuario, ventaId }) {
  const venta = await Venta.findByPk(ventaId, {
    include: [{ model: Recibo, as: 'recibo' }],
  });

  if (!venta) {
    throw new AppError('Venta no encontrada', 404);
  }

  const esPropietario = Number(venta.usuarioId) === Number(usuario.id);
  if (!esPropietario && !STAFF_ROLES.includes(usuario.rol)) {
    throw new AppError('No tienes permisos para ver este recibo', 403);
  }

  if (!venta.recibo) {
    throw new AppError('El recibo aún no está disponible para esta venta', 404);
  }

  return serializarRecibo(venta.recibo);
}

async function listarTransacciones({ limit = 100 } = {}) {
  const items = await Transaccion.findAll({
    include: [
      { model: Venta, as: 'venta', attributes: ['id', 'estado', 'total'] },
      { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email'] },
      { model: Recibo, as: 'recibo', attributes: ['id', 'numero'] },
    ],
    order: [['id', 'DESC']],
    limit,
  });

  return items.map((transaccion) => ({
    ...serializarTransaccion(transaccion),
    venta: transaccion.venta
      ? {
          id: transaccion.venta.id,
          estado: transaccion.venta.estado,
          total: Number(transaccion.venta.total),
        }
      : null,
    usuario: transaccion.usuario
      ? {
          id: transaccion.usuario.id,
          nombre: transaccion.usuario.nombre,
          email: transaccion.usuario.email,
        }
      : null,
    recibo: transaccion.recibo
      ? { id: transaccion.recibo.id, numero: transaccion.recibo.numero }
      : null,
  }));
}

async function listarAuditoria({ limit = 100 } = {}) {
  const items = await EventoAuditoria.findAll({
    include: [
      { model: Venta, as: 'venta', attributes: ['id', 'estado'] },
      { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email'] },
    ],
    order: [['id', 'DESC']],
    limit,
  });

  return items.map((evento) => ({
    id: evento.id,
    tipo: evento.tipo,
    severidad: evento.severidad,
    mensaje: evento.mensaje,
    ventaId: evento.ventaId,
    transaccionId: evento.transaccionId,
    usuario: evento.usuario
      ? {
          id: evento.usuario.id,
          nombre: evento.usuario.nombre,
          email: evento.usuario.email,
        }
      : null,
    payload: evento.payload,
    fecha: evento.createdAt,
  }));
}

module.exports = {
  METODOS_PAGO,
  listarMetodos,
  crearCheckout,
  actualizarEntrega,
  procesarPago,
  obtenerVenta,
  obtenerRecibo,
  listarTransacciones,
  listarAuditoria,
  liberarBloqueosExpirados,
};
