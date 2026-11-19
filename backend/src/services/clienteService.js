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
    referenciaComprobante:
      (transacciones[0] && transacciones[0].referenciaComprobante) || null,
    codigoTransaccion:
      (venta.recibo && venta.recibo.codigoTransaccion) ||
      (transacciones[0] && transacciones[0].codigoTransaccion) ||
      null,
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
  const includeItems = () => ({
    model: VentaItem,
    as: 'items',
    include: [
      {
        model: Variante,
        as: 'variante',
        include: [{ model: Producto, as: 'producto' }],
      },
    ],
  });
  const includeRecibo = () => ({ model: Recibo, as: 'recibo' });
  const includeCheckout = () => ({ model: Checkout, as: 'checkout' });
  const includeTransacciones = () => ({ model: Transaccion, as: 'transacciones' });
  const ordenVentas = [
    ['createdAt', 'DESC'],
    ['id', 'DESC'],
  ];

  // REQ-PAG-QR-01: las ventas por transferencia quedan "pendiente" hasta la
  // verificación manual, pero el cliente debe seguir viéndolas en su historial.
  const [ventas, pendientesComprobante] = await Promise.all([
    Venta.findAll({
      where: {
        usuarioId: usuario.id,
        estado: { [Op.ne]: 'pendiente' },
      },
      include: [
        includeItems(),
        { model: Despacho, as: 'despacho' },
        includeRecibo(),
        includeCheckout(),
        includeTransacciones(),
      ],
      order: ordenVentas,
    }),
    Venta.findAll({
      where: {
        usuarioId: usuario.id,
        estado: 'pendiente',
      },
      include: [
        includeItems(),
        {
          model: Despacho,
          as: 'despacho',
          where: { estado: 'EN_ESPERA_COMPROBACION' },
          required: true,
        },
        includeRecibo(),
        includeCheckout(),
        includeTransacciones(),
      ],
      order: ordenVentas,
    }),
  ]);

  return [...ventas, ...pendientesComprobante]
    .sort((a, b) => {
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      if (tb !== ta) return tb - ta;
      return Number(b.id) - Number(a.id);
    })
    .map(serializarResumenPedido);
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

async function listarReclamos({ usuario }) {
  const { Reclamo } = require('../models');
  const reclamos = await Reclamo.findAll({
    where: { usuarioId: usuario.id },
    order: [['createdAt', 'DESC']],
  });
  return reclamos.map((r) => ({
    id: r.id,
    codigo: r.codigo,
    tipo: r.tipoSolicitud,
    estado: r.estado,
    fechaCreacion: r.createdAt,
    descripcion: r.descripcion,
    solucion: r.solucion,
    empleadoAsignadoId: r.empleadoAsignadoId,
  }));
}

function obtenerListaTarjetasDesdeUsuario(user) {
  try {
    if (user && user.tarjetasGuardadas) {
      const parsed = JSON.parse(user.tarjetasGuardadas);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    // ignore parse error
  }
  return [];
}

async function listarTarjetas({ usuario }) {
  const { Usuario } = require('../models');
  const user = await Usuario.findByPk(usuario.id);
  if (!user) throw new AppError('Usuario no encontrado', 404);
  const tarjetas = obtenerListaTarjetasDesdeUsuario(user);
  return tarjetas.map((t, index) => ({
    id: t.id || index + 1,
    ultimos4: t.ultimos4,
    marca: t.marca,
    titular: t.titular,
    expiraMes: t.expiraMes,
    expiraAnio: t.expiraAnio,
    createdAt: t.createdAt || null,
  }));
}

async function agregarTarjeta({ usuario, payload = {} }) {
  const { Usuario } = require('../models');
  const { ultimos4, marca, titular, expiraMes, expiraAnio } = payload;
  if (!ultimos4 || !marca || !titular || !expiraMes || !expiraAnio) {
    throw new AppError('Todos los campos de la tarjeta son requeridos', 400);
  }
  const digits = String(ultimos4).replace(/\D/g, '');
  if (digits.length !== 4) {
    throw new AppError('Los últimos 4 dígitos de la tarjeta son inválidos', 400);
  }
  const user = await Usuario.findByPk(usuario.id);
  if (!user) throw new AppError('Usuario no encontrado', 404);

  const tarjetas = obtenerListaTarjetasDesdeUsuario(user);
  const nueva = {
    id: Date.now(),
    ultimos4: digits,
    marca: String(marca).trim().slice(0, 40),
    titular: String(titular).trim().slice(0, 120),
    expiraMes: String(expiraMes).padStart(2, '0').slice(-2),
    expiraAnio: String(expiraAnio).slice(-2),
    createdAt: new Date().toISOString(),
  };
  tarjetas.push(nueva);
  await user.update({ tarjetasGuardadas: JSON.stringify(tarjetas) });
  return { success: true, tarjeta: nueva };
}

async function eliminarTarjeta({ usuario, tarjetaId }) {
  const { Usuario } = require('../models');
  const user = await Usuario.findByPk(usuario.id);
  if (!user) throw new AppError('Usuario no encontrado', 404);
  const tarjetas = obtenerListaTarjetasDesdeUsuario(user);
  const id = Number(tarjetaId);
  const filtradas = tarjetas.filter((t) => Number(t.id) !== id);
  if (filtradas.length === tarjetas.length) {
    throw new AppError('Tarjeta no encontrada', 404);
  }
  await user.update({ tarjetasGuardadas: JSON.stringify(filtradas) });
  return { success: true, message: 'Tarjeta eliminada correctamente' };
}

async function listarReclamos({ usuario }) {
  const { Reclamo } = require('../models');
  const reclamos = await Reclamo.findAll({
    where: { usuarioId: usuario.id },
    order: [['createdAt', 'DESC']],
  });
  return reclamos.map((r) => ({
    id: r.id,
    codigo: r.codigo,
    tipo: r.tipoSolicitud,
    estado: r.estado,
    fechaCreacion: r.createdAt,
    descripcion: r.descripcion,
    solucion: r.solucion,
    empleadoAsignadoId: r.empleadoAsignadoId,
  }));
}

function esEstadoPedidoEnCurso(estadoLogistico) {
  const EN_CURSO = [
    'PENDIENTE',
    'EN_ESPERA_COMPROBACION',
    'PEDIDO_CONFIRMADO',
    'PREPARANDO_PEDIDO',
    'EN_PREPARACION',
    'EN_CAMINO',
  ];
  return EN_CURSO.includes(String(estadoLogistico || '').toUpperCase());
}

async function obtenerPerfil({ usuario }) {
  const { Usuario, Direccion, Reclamo, Venta, VentaItem, Variante, Producto, Despacho } = require('../models');
  const user = await Usuario.findByPk(usuario.id);
  if (!user) throw new AppError('Usuario no encontrado', 404);

  const [direcciones, reclamos, ventas] = await Promise.all([
    Direccion.findAll({
      where: { usuarioId: usuario.id },
      order: [['predeterminada', 'DESC'], ['id', 'DESC']],
    }),
    Reclamo.findAll({
      where: { usuarioId: usuario.id },
      order: [['createdAt', 'DESC']],
    }),
    Venta.findAll({
      where: { usuarioId: usuario.id },
      include: [
        { model: Despacho, as: 'despacho' },
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
      ],
      order: [['createdAt', 'DESC']],
    }),
  ]);

  const pedidosEnCurso = [];
  const historialPedidos = [];
  for (const venta of ventas) {
    const estadoLogistico = venta.despacho
      ? distribucionService.normalizarEstadoLogistico(venta.despacho.estado)
      : venta.estado === 'enviada'
        ? 'EN_CAMINO'
        : venta.estado === 'entregada'
          ? 'ENTREGADO'
          : venta.estado === 'cancelada' || venta.estado === 'CANCELADO'
            ? 'CANCELADO'
            : 'PEDIDO_CONFIRMADO';

    const puedeCancelar = esCancelable(venta.estado, estadoLogistico);
    const item = {
      id: venta.id,
      ventaId: venta.id,
      numeroPedido: `PED-${String(venta.id).padStart(4, '0')}`,
      fecha: venta.createdAt,
      total: Number(venta.total),
      estado: estadoLogistico,
      estadoPago: venta.estado,
      puedeCancelar,
      codigoSeguimiento: venta.despacho ? venta.despacho.codigoSeguimiento : null,
      items: (venta.items || []).map((i) => ({
        varianteId: i.varianteId,
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario,
        subtotal: i.precioUnitario * i.cantidad,
        producto: i.variante?.producto?.nombre,
        imagen: i.variante?.imagenes?.[0] || i.variante?.producto?.imagenPrincipal,
      })),
    };

    if (esEstadoPedidoEnCurso(estadoLogistico)) {
      pedidosEnCurso.push(item);
    } else {
      historialPedidos.push(item);
    }
  }

  const tarjetas = obtenerListaTarjetasDesdeUsuario(user);

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    nombre: user.nombre,
    telefono: user.telefono,
    fotoPerfil: user.fotoPerfil || null,
    tarjetas,
    direcciones: direcciones.map((d) => ({
      id: d.id,
      etiqueta: d.etiqueta,
      nombreDestinatario: d.nombreDestinatario,
      calle: d.calle,
      ciudad: d.ciudad,
      telefono: d.telefono,
      referencias: d.referencias || null,
      predeterminada: Boolean(d.predeterminada),
    })),
    reclamos: reclamos.map((r) => ({
      id: r.id,
      codigo: r.codigo,
      tipo: r.tipoSolicitud,
      estado: r.estado,
      fechaCreacion: r.createdAt,
      descripcion: r.descripcion,
      solucion: r.solucion || null,
      empleadoAsignadoId: r.empleadoAsignadoId || null,
    })),
    pedidos: pedidosEnCurso,
    pedidosHistorial: historialPedidos,
  };
}

async function actualizarPerfil({ usuario, payload = {} }) {
  const { Usuario } = require('../models');
  const { normalizarFoto } = require('../utils/imagePayload');

  const updates = {};
  if (payload.nombre !== undefined) {
    const nombre = String(payload.nombre).trim().slice(0, 120);
    if (!nombre) throw new AppError('El nombre es requerido', 400);
    updates.nombre = nombre;
  }
  if (payload.telefono !== undefined) {
    updates.telefono = String(payload.telefono).trim().slice(0, 40) || null;
  }
  if (payload.fotoPerfil !== undefined) {
    try {
      updates.fotoPerfil = normalizarFoto(payload.fotoPerfil);
    } catch (err) {
      throw new AppError('Formato o tamaño de imagen no admitido', 400);
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError('No se enviaron campos válidos para actualizar', 400);
  }

  const user = await Usuario.findByPk(usuario.id);
  if (!user) throw new AppError('Usuario no encontrado', 404);
  await user.update(updates);

  return {
    success: true,
    message: 'Perfil actualizado correctamente',
    perfil: {
      id: user.id,
      username: user.username,
      email: user.email,
      nombre: user.nombre,
      telefono: user.telefono,
      fotoPerfil: user.fotoPerfil || null,
    },
  };
}

async function cambiarEmail({ usuario, payload = {} }) {
  const { Usuario } = require('../models');
  const bcrypt = require('bcryptjs');

  const email = String(payload.email ?? payload.nuevoEmail ?? payload.correo ?? '').trim().toLowerCase();
  const passwordActual = String(payload.passwordActual ?? payload.password ?? '').trim();

  if (!email || !passwordActual) {
    throw new AppError('Nuevo correo y contraseña actual son requeridos', 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError('El correo electrónico ingresado no es válido', 400);
  }

  const user = await Usuario.findByPk(usuario.id);
  if (!user) throw new AppError('Usuario no encontrado', 404);

  const passwordValida = await bcrypt.compare(passwordActual, user.passwordHash);
  if (!passwordValida) {
    throw new AppError('La contraseña actual es incorrecta', 400);
  }

  if (email === String(user.email).toLowerCase()) {
    throw new AppError('El nuevo correo debe ser diferente al actual', 400);
  }

  const duplicado = await Usuario.findOne({ where: { email } });
  if (duplicado && duplicado.id !== user.id) {
    throw new AppError('El correo electrónico ya está en uso', 400);
  }

  await user.update({ email });

  return { success: true, message: 'Correo actualizado correctamente', email: user.email };
}

async function cambiarPassword({ usuario, payload = {} }) {
  const { Usuario } = require('../models');
  const bcrypt = require('bcryptjs');

  const passwordActual = String(payload.passwordActual ?? payload.actual ?? '').trim();
  const nuevaPassword = String(payload.nuevaPassword ?? payload.nueva ?? '').trim();
  const confirmarPassword = String(
    payload.confirmarPassword ?? payload.confirmar ?? payload.confirmacion ?? ''
  ).trim();

  if (!passwordActual || !nuevaPassword || !confirmarPassword) {
    throw new AppError('Todos los campos son requeridos', 400);
  }
  if (nuevaPassword.length < 8) {
    throw new AppError('La nueva contraseña debe tener al menos 8 caracteres', 400);
  }
  if (nuevaPassword !== confirmarPassword) {
    throw new AppError('La nueva contraseña y la confirmación no coinciden', 400);
  }

  const user = await Usuario.findByPk(usuario.id);
  if (!user) throw new AppError('Usuario no encontrado', 404);

  const passwordValida = await bcrypt.compare(passwordActual, user.passwordHash);
  if (!passwordValida) {
    throw new AppError('La contraseña actual es incorrecta', 400);
  }

  const newHash = await bcrypt.hash(nuevaPassword, 12);
  await user.update({ passwordHash: newHash });

  return { success: true, message: 'Contraseña actualizada correctamente' };
}

async function eliminarCuenta({ usuario }) {
  const { Usuario } = require('../models');
  const user = await Usuario.findByPk(usuario.id);
  if (!user) throw new AppError('Usuario no encontrado', 404);
  await user.update({ activo: false });
  return { success: true, message: 'Cuenta eliminada correctamente' };
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
  obtenerPerfil,
  actualizarPerfil,
  cambiarEmail,
  cambiarPassword,
  eliminarCuenta,
  listarTarjetas,
  agregarTarjeta,
  eliminarTarjeta,
  listarReclamos,
};
