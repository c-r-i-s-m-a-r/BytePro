const { Op } = require('sequelize');
const {
  sequelize,
  Despacho,
  Venta,
  VentaItem,
  Variante,
  Producto,
  Recibo,
  Transaccion,
  Usuario,
  Cliente,
  Direccion,
} = require('../models');
const AppError = require('../utils/AppError');
const { round2 } = require('../utils/money');
const emailService = require('./emailService');

const CIUDADES_COBERTURA = [
  'La Paz',
  'El Alto',
  'Cochabamba',
  'Santa Cruz',
  'Santa Cruz de la Sierra',
  'Sucre',
  'Oruro',
  'Potosí',
  'Potosi',
  'Tarija',
  'Trinidad',
  'Cobija',
  'Montero',
  'Quillacollo',
  'Sacaba',
  'Viacha',
  'Warnes',
];

const ETAPAS_DEFINICION = [
  {
    codigo: 'PEDIDO_CONFIRMADO',
    nombre: 'Pedido confirmado',
    descripcion: 'Pago validado y orden recibida',
    ubicacionDefault: 'Centro de Recepción BytePro',
    orden: 1,
  },
  {
    codigo: 'EN_PREPARACION',
    nombre: 'En preparación',
    descripcion: 'Empaquetado en almacén de hardware',
    ubicacionDefault: 'Almacén de Hardware BytePro',
    orden: 2,
  },
  {
    codigo: 'EN_CAMINO',
    nombre: 'En camino',
    descripcion: 'Entregado al transportista / en ruta de distribución',
    ubicacionDefault: 'En ruta de distribución nacional',
    orden: 3,
  },
  {
    codigo: 'ENTREGADO',
    nombre: 'Entregado',
    descripcion: 'Entregado satisfactoriamente al destinatario',
    ubicacionDefault: 'Domicilio del destinatario',
    orden: 4,
  },
];

const TRANSICIONES_VALIDAS = {
  PREPARANDO_PEDIDO: ['PEDIDO_CONFIRMADO', 'EN_PREPARACION'],
  PEDIDO_CONFIRMADO: ['EN_PREPARACION'],
  EN_PREPARACION: ['EN_CAMINO'],
  EN_CAMINO: ['ENTREGADO'],
  ENTREGADO: [],
  CANCELADO: [],
};

function normalizarTextoComparacion(valor) {
  return String(valor || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function buscarCiudadCobertura(ciudadInput) {
  const buscada = normalizarTextoComparacion(ciudadInput);
  if (!buscada) return null;
  return (
    CIUDADES_COBERTURA.find((c) => normalizarTextoComparacion(c) === buscada) || null
  );
}

function normalizarEstadoLogistico(estado) {
  const raw = String(estado || '').trim().toUpperCase();
  if (raw === 'PENDIENTE' || raw === 'PREPARANDO_PEDIDO') return 'PEDIDO_CONFIRMADO';
  if (raw === 'PREPARANDO') return 'EN_PREPARACION';
  if (raw === 'ENVIADO') return 'EN_CAMINO';
  if (raw === 'ENTREGADO') return 'ENTREGADO';
  if (raw === 'CANCELADO' || raw === 'CANCELADA') return 'CANCELADO';
  return raw;
}

function formatearFechaYMD(fecha = new Date()) {
  const d = new Date(fecha);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

function SufijoAlfanumerico(longitud = 4) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < longitud; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function generarCodigoTracking(fecha = new Date(), transaction = null) {
  const ymd = formatearFechaYMD(fecha);
  for (let intento = 0; intento < 20; intento += 1) {
    const candidato = `TRK-${ymd}-${SufijoAlfanumerico(4)}`;
    // eslint-disable-next-line no-await-in-loop
    const existente = await Despacho.findOne({
      where: { codigoSeguimiento: candidato },
      transaction,
    });
    if (!existente) return candidato;
  }
  const fallback = String(Date.now()).slice(-4);
  return `TRK-${ymd}-${fallback}`;
}

function extraerInputEntrega(payload) {
  if (!payload || typeof payload !== 'object') return null;
  if (payload.direccionEntrega && typeof payload.direccionEntrega === 'object') {
    return payload.direccionEntrega;
  }
  if (payload.datosEntrega && typeof payload.datosEntrega === 'object') {
    return payload.datosEntrega;
  }
  const tieneCamposDirectos = [
    'nombreDestinatario',
    'destinatario',
    'direccion',
    'direccionExacta',
    'calle',
    'ciudad',
    'telefono',
    'telefonoContacto',
    'fueraDeCobertura',
  ].some((k) => payload[k] !== undefined);

  if (tieneCamposDirectos) {
    return payload;
  }
  return null;
}

function validarDireccionEntrega(input) {
  const data = input && typeof input === 'object' ? input : {};
  const nombreDestinatario = String(
    data.nombreDestinatario ?? data.destinatario ?? data.nombre ?? data.receptor ?? ''
  ).trim();
  const direccion = String(
    data.direccion ?? data.direccionExacta ?? data.calle ?? ''
  ).trim();
  const ciudadRaw = String(
    data.ciudad ?? data.localidad ?? data.municipio ?? ''
  ).trim();
  const telefono = String(
    data.telefono ?? data.telefonoContacto ?? data.celular ?? ''
  ).trim();
  const notas =
    String(
      data.notas ?? data.notasEntrega ?? data.referencias ?? ''
    ).trim() || null;

  const errores = [];
  if (!nombreDestinatario || nombreDestinatario.length < 2) {
    errores.push({
      field: 'nombreDestinatario',
      message: 'El nombre del destinatario es obligatorio',
    });
  }
  if (!direccion || direccion.length < 4) {
    errores.push({
      field: 'direccion',
      message: 'La dirección exacta de entrega es obligatoria',
    });
  }
  if (!ciudadRaw) {
    errores.push({
      field: 'ciudad',
      message: 'La ciudad de entrega es obligatoria',
    });
  }
  if (!telefono || telefono.length < 5) {
    errores.push({
      field: 'telefono',
      message: 'El teléfono de contacto es obligatorio',
    });
  }

  if (errores.length > 0) {
    throw new AppError(
      'La dirección de entrega no contiene todos los campos obligatorios (destinatario, dirección exacta, ciudad y teléfono)',
      400,
      errores
    );
  }

  const ciudadCobertura = buscarCiudadCobertura(ciudadRaw);
  if (data.fueraDeCobertura === true || !ciudadCobertura) {
    throw new AppError(
      `La ciudad "${ciudadRaw}" se encuentra fuera del área de cobertura configurada para envíos`,
      400,
      [
        {
          field: 'ciudad',
          message: 'La dirección se encuentra fuera del área de cobertura configurada',
          ciudadesDisponibles: CIUDADES_COBERTURA,
        },
      ]
    );
  }

  return {
    nombreDestinatario: nombreDestinatario.slice(0, 160),
    direccion: direccion.slice(0, 255),
    ciudad: ciudadCobertura,
    telefono: telefono.slice(0, 40),
    notas: notas ? notas.slice(0, 500) : null,
  };
}

async function resolverDatosEntrega({ usuario, payload = {}, checkout = null, transaction = null }) {
  if (payload && payload.direccionId) {
    const guardada = await Direccion.findOne({
      where: { id: Number(payload.direccionId), usuarioId: usuario.id },
      transaction,
    });
    if (!guardada) {
      throw new AppError('La dirección seleccionada no existe en tu libreta', 404);
    }
    return validarDireccionEntrega({
      nombreDestinatario: guardada.nombreDestinatario,
      direccion: guardada.calle,
      ciudad: guardada.ciudad,
      telefono: guardada.telefono,
      notas: guardada.referencias,
    });
  }

  const explicita = extraerInputEntrega(payload);
  if (explicita) {
    return validarDireccionEntrega(explicita);
  }

  if (
    checkout &&
    checkout.nombreDestinatario &&
    checkout.direccion &&
    checkout.ciudad &&
    checkout.telefono
  ) {
    return {
      nombreDestinatario: checkout.nombreDestinatario,
      direccion: checkout.direccion,
      ciudad: checkout.ciudad,
      telefono: checkout.telefono,
      notas: checkout.notas || null,
    };
  }

  const direccionGuardada = await Direccion.findOne({
    where: { usuarioId: usuario.id },
    order: [
      ['predeterminada', 'DESC'],
      ['id', 'DESC'],
    ],
    transaction,
  });

  if (direccionGuardada) {
    return {
      nombreDestinatario: direccionGuardada.nombreDestinatario,
      direccion: direccionGuardada.calle,
      ciudad: direccionGuardada.ciudad || 'La Paz',
      telefono: direccionGuardada.telefono,
      notas: direccionGuardada.referencias || null,
    };
  }

  const perfilCliente = await Cliente.findOne({
    where: { usuarioId: usuario.id },
    transaction,
  });

  return {
    nombreDestinatario: (usuario && usuario.nombre) || 'Cliente BytePro',
    direccion: (perfilCliente && perfilCliente.direccion) || 'Av. Principal 123',
    ciudad: 'La Paz',
    telefono: (usuario && usuario.telefono) || '70000001',
    notas: null,
  };
}

function normalizarHistorial(historial, despacho) {
  let lista = [];
  if (Array.isArray(historial)) {
    lista = historial;
  } else if (typeof historial === 'string' && historial.trim()) {
    try {
      const parsed = JSON.parse(historial);
      if (Array.isArray(parsed)) lista = parsed;
    } catch (err) {
      lista = [];
    }
  }

  if (!lista.length && despacho) {
    lista = [
      {
        estado: 'PEDIDO_CONFIRMADO',
        timestamp: (despacho.createdAt || new Date()).toISOString(),
        ubicacion: despacho.ubicacionActual || 'Centro de Recepción BytePro',
        puntoControl: despacho.ubicacionActual || 'Centro de Recepción BytePro',
        nota: despacho.nota || 'Pago validado y orden recibida.',
      },
    ];
  }

  return lista;
}

function construirEtapas(estadoActual, historial = []) {
  const normalizado = normalizarEstadoLogistico(estadoActual);
  const cancelado = normalizado === 'CANCELADO';
  const defActual = ETAPAS_DEFINICION.find((e) => e.codigo === normalizado);
  const ordenActual = defActual ? defActual.orden : cancelado ? 0 : 1;

  return ETAPAS_DEFINICION.map((def) => {
    const evento = historial.find(
      (h) => normalizarEstadoLogistico(h.estado) === def.codigo
    );
    const completado = !cancelado && def.orden <= ordenActual;
    const enProgreso = !cancelado && def.orden === ordenActual && def.codigo !== 'ENTREGADO';
    const pendiente = cancelado || def.orden > ordenActual;

    return {
      codigo: def.codigo,
      nombre: def.nombre,
      descripcion: def.descripcion,
      orden: def.orden,
      completado,
      enProgreso,
      pendiente,
      timestamp: evento ? evento.timestamp : null,
      ubicacion: evento ? evento.ubicacion || evento.puntoControl || null : null,
      nota: evento ? evento.nota || null : null,
    };
  });
}

function calcularProgreso(estadoActual) {
  const normalizado = normalizarEstadoLogistico(estadoActual);
  if (normalizado === 'CANCELADO') return 0;
  if (normalizado === 'PEDIDO_CONFIRMADO') return 25;
  if (normalizado === 'EN_PREPARACION') return 50;
  if (normalizado === 'EN_CAMINO') return 75;
  if (normalizado === 'ENTREGADO') return 100;
  return 25;
}

function obtenerSiguienteEstado(estadoActual) {
  const raw = String(estadoActual || '').trim().toUpperCase();
  const clave = TRANSICIONES_VALIDAS[raw] ? raw : normalizarEstadoLogistico(raw);
  const posibles = TRANSICIONES_VALIDAS[clave] || [];
  if (posibles.includes('EN_PREPARACION') && clave === 'PREPARANDO_PEDIDO') {
    return 'EN_PREPARACION';
  }
  return posibles[0] || null;
}

function etiquetaPildoraPedido(ventaEstado, despachoEstado) {
  const log = normalizarEstadoLogistico(despachoEstado);
  const vnt = String(ventaEstado || '').toUpperCase();
  if (vnt === 'CANCELADO' || vnt === 'CANCELADA' || log === 'CANCELADO') {
    return 'Cancelado';
  }
  if (log === 'ENTREGADO' || vnt === 'ENTREGADA') return 'Entregado';
  if (log === 'EN_CAMINO' || vnt === 'ENVIADA') return 'En camino';
  if (log === 'EN_PREPARACION') return 'En preparación';
  return 'Pagado';
}

function serializarDespacho(despacho, { publico = false } = {}) {
  if (!despacho) return null;
  const estado = normalizarEstadoLogistico(despacho.estado);
  const historial = normalizarHistorial(despacho.historial, despacho);
  const etapas = construirEtapas(estado, historial);
  const progreso = calcularProgreso(estado);
  const fechaEstimada =
    despacho.fechaEstimada ||
    new Date(new Date(despacho.createdAt || Date.now()).getTime() + 3 * 24 * 60 * 60 * 1000);

  const base = {
    id: despacho.id,
    ventaId: despacho.ventaId,
    codigoSeguimiento: despacho.codigoSeguimiento,
    trackingCode: despacho.codigoSeguimiento,
    codigo: despacho.codigoSeguimiento,
    numeroGuia: despacho.codigoSeguimiento,
    estado,
    estadoInicial: 'PREPARANDO_PEDIDO',
    pildora: etiquetaPildoraPedido(null, estado),
    siguienteEstado: obtenerSiguienteEstado(despacho.estado),
    progreso,
    ubicacionActual: despacho.ubicacionActual || 'Centro de Distribución BytePro',
    puntoControl: despacho.ubicacionActual || 'Centro de Distribución BytePro',
    ciudad: despacho.ciudad || 'La Paz',
    fechaEstimada,
    fechaEstimadaEntrega: fechaEstimada,
    nota: despacho.nota || null,
    etapas,
    historial,
    createdAt: despacho.createdAt,
    updatedAt: despacho.updatedAt,
  };

  if (publico) {
    return base;
  }

  return {
    ...base,
    nombreDestinatario: despacho.nombreDestinatario,
    destinatario: despacho.nombreDestinatario,
    direccion: despacho.direccion,
    direccionExacta: despacho.direccion,
    telefono: despacho.telefono,
    notas: despacho.notas,
    notasEntrega: despacho.notas,
    datosEntrega: {
      nombreDestinatario: despacho.nombreDestinatario,
      destinatario: despacho.nombreDestinatario,
      direccion: despacho.direccion,
      direccionExacta: despacho.direccion,
      ciudad: despacho.ciudad,
      telefono: despacho.telefono,
      notas: despacho.notas,
    },
  };
}

async function crearDespachoPago({
  venta,
  checkout,
  usuario,
  datosEntrega,
  transaction,
}) {
  const entrega =
    datosEntrega ||
    (await resolverDatosEntrega({
      usuario,
      payload: {},
      checkout,
      transaction,
    }));

  const existente = await Despacho.findOne({
    where: { ventaId: venta.id },
    transaction,
  });

  const ahora = new Date();
  const fechaEstimada = new Date(ahora.getTime() + 3 * 24 * 60 * 60 * 1000);
  const codigoSeguimiento =
    existente && existente.codigoSeguimiento
      ? existente.codigoSeguimiento
      : await generarCodigoTracking(ahora, transaction);

  const eventoInicial = {
    estado: 'PEDIDO_CONFIRMADO',
    faseInicial: 'PREPARANDO_PEDIDO',
    timestamp: ahora.toISOString(),
    ubicacion: 'Centro de Recepción BytePro',
    puntoControl: 'Pago validado y orden recibida',
    nota: 'Pago confirmado. Orden registrada para preparación en almacén.',
  };

  if (existente) {
    await existente.update(
      {
        codigoSeguimiento,
        estado: 'PEDIDO_CONFIRMADO',
        nombreDestinatario: entrega.nombreDestinatario,
        direccion: entrega.direccion,
        ciudad: entrega.ciudad,
        telefono: entrega.telefono,
        notas: entrega.notas,
        ubicacionActual: 'Centro de Recepción BytePro',
        fechaEstimada,
        historial: [eventoInicial],
        nota: 'Pago confirmado. Pendiente de preparación.',
      },
      { transaction }
    );
    return existente;
  }

  return Despacho.create(
    {
      ventaId: venta.id,
      codigoSeguimiento,
      estado: 'PEDIDO_CONFIRMADO',
      nombreDestinatario: entrega.nombreDestinatario,
      direccion: entrega.direccion,
      ciudad: entrega.ciudad,
      telefono: entrega.telefono,
      notas: entrega.notas,
      ubicacionActual: 'Centro de Recepción BytePro',
      fechaEstimada,
      historial: [eventoInicial],
      nota: 'Pago confirmado. Pendiente de preparación.',
    },
    { transaction }
  );
}

async function buscarDespachoPorIdentificador(idOrCodigo, transaction = null) {
  const valor = String(idOrCodigo || '').trim();
  if (!valor) return null;

  if (valor.toUpperCase().startsWith('TRK-')) {
    return Despacho.findOne({
      where: { codigoSeguimiento: valor.toUpperCase() },
      transaction,
    });
  }

  const numId = Number(valor);
  if (Number.isInteger(numId) && numId > 0) {
    const porVenta = await Despacho.findOne({
      where: { ventaId: numId },
      transaction,
    });
    if (porVenta) return porVenta;

    return Despacho.findByPk(numId, { transaction });
  }

  return Despacho.findOne({
    where: { codigoSeguimiento: valor },
    transaction,
  });
}

async function actualizarEstadoDespacho({
  idOrCodigo,
  nuevoEstado,
  ubicacion,
  puntoControl,
  nota,
  usuario,
}) {
  const destinoRaw = String(nuevoEstado || '').trim().toUpperCase();
  const etapasValidas = ETAPAS_DEFINICION.map((e) => e.codigo);

  if (!etapasValidas.includes(destinoRaw)) {
    throw new AppError('Transición de estado logística inválida', 400);
  }

  const despacho = await buscarDespachoPorIdentificador(idOrCodigo);
  if (!despacho) {
    throw new AppError(
      'El número de guía no fue encontrado. Verifica el código e intenta nuevamente',
      404
    );
  }

  const estadoActualRaw = String(despacho.estado || '').trim().toUpperCase();
  const claveActual = TRANSICIONES_VALIDAS[estadoActualRaw]
    ? estadoActualRaw
    : normalizarEstadoLogistico(estadoActualRaw);

  const permitidos = TRANSICIONES_VALIDAS[claveActual] || [];
  if (!permitidos.includes(destinoRaw)) {
    throw new AppError('Transición de estado logística inválida', 400, {
      estadoActual: normalizarEstadoLogistico(estadoActualRaw),
      estadoSolicitado: destinoRaw,
      transicionesPermitidas: permitidos,
    });
  }

  const defEtapa = ETAPAS_DEFINICION.find((e) => e.codigo === destinoRaw);
  const ubicacionFinal =
    String(ubicacion || puntoControl || '').trim() ||
    (defEtapa ? defEtapa.ubicacionDefault : 'Centro de Distribución BytePro');
  const notaFinal =
    String(nota || '').trim() ||
    (defEtapa ? defEtapa.descripcion : 'Actualización de estado logístico');
  const ahora = new Date();

  let venta = null;
  let clienteUsuario = null;

  await sequelize.transaction(async (transaction) => {
    const historialActual = normalizarHistorial(despacho.historial, despacho);
    const nuevoEvento = {
      estado: destinoRaw,
      timestamp: ahora.toISOString(),
      ubicacion: ubicacionFinal,
      puntoControl: ubicacionFinal,
      nota: notaFinal,
      usuarioId: usuario ? usuario.id : null,
      operador: usuario ? usuario.nombre : 'Operaciones BytePro',
    };

    await despacho.update(
      {
        estado: destinoRaw,
        ubicacionActual: ubicacionFinal,
        nota: notaFinal,
        historial: [...historialActual, nuevoEvento],
      },
      { transaction }
    );

    venta = await Venta.findByPk(despacho.ventaId, { transaction });
    if (venta) {
      if (destinoRaw === 'EN_CAMINO' && venta.estado === 'pagada') {
        await venta.update({ estado: 'enviada' }, { transaction });
      } else if (destinoRaw === 'ENTREGADO') {
        await venta.update({ estado: 'entregada' }, { transaction });
      }
      clienteUsuario = await Usuario.findByPk(venta.usuarioId, { transaction });
    }
  });

  const notificacion = await emailService.enviarActualizacionEnvio({
    despacho,
    venta,
    usuario: clienteUsuario,
    estado: destinoRaw,
    ubicacion: ubicacionFinal,
  });

  return {
    ...serializarDespacho(despacho, { publico: false }),
    notificacion,
  };
}

async function consultarTracking({ codigo, usuario = null, modoForzado = null }) {
  const codigoLimpio = String(codigo || '').trim().toUpperCase();
  if (!codigoLimpio) {
    throw new AppError(
      'El número de guía no fue encontrado. Verifica el código e intenta nuevamente',
      404
    );
  }

  const despacho = await Despacho.findOne({
    where: { codigoSeguimiento: codigoLimpio },
    include: [
      {
        model: Venta,
        as: 'venta',
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
          { model: Recibo, as: 'recibo' },
          {
            model: Transaccion,
            as: 'transacciones',
          },
        ],
      },
    ],
  });

  if (!despacho) {
    throw new AppError(
      'El número de guía no fue encontrado. Verifica el código e intenta nuevamente',
      404
    );
  }

  const esPrivado = Boolean(usuario) && modoForzado !== 'publico';
  const serializado = serializarDespacho(despacho, { publico: !esPrivado });

  if (!esPrivado) {
    return {
      ...serializado,
      modo: 'publico',
      privado: false,
      autenticado: false,
    };
  }

  const venta = despacho.venta;
  const componentes = ((venta && venta.items) || []).map((item) => {
    const variante = item.variante;
    const producto = variante ? variante.producto : null;
    const cantidad = Number(item.cantidad) || 0;
    const precioUnitario = Number(item.precioUnitario) || 0;
    return {
      varianteId: item.varianteId,
      sku: variante ? variante.sku : null,
      nombreProducto: producto ? producto.nombre : 'Componente de hardware',
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

  const recibo = venta && venta.recibo
    ? {
        id: venta.recibo.id,
        numero: venta.recibo.numero,
        ventaId: venta.recibo.ventaId,
        subtotal: Number(venta.recibo.subtotal),
        impuestos: Number(venta.recibo.impuestos),
        total: Number(venta.recibo.total),
        moneda: venta.recibo.moneda,
        metodo: venta.recibo.metodo,
        codigoTransaccion: venta.recibo.codigoTransaccion,
        fecha: venta.recibo.createdAt,
      }
    : null;

  return {
    ...serializado,
    modo: 'privado',
    privado: true,
    autenticado: true,
    items: componentes,
    componentes,
    comprobante: recibo,
    recibo,
    venta: venta
      ? {
          id: venta.id,
          estado: venta.estado,
          total: Number(venta.total),
          fecha: venta.createdAt,
        }
      : null,
  };
}

module.exports = {
  CIUDADES_COBERTURA,
  ETAPAS_DEFINICION,
  TRANSICIONES_VALIDAS,
  generarCodigoTracking,
  validarDireccionEntrega,
  resolverDatosEntrega,
  crearDespachoPago,
  actualizarEstadoDespacho,
  consultarTracking,
  serializarDespacho,
  normalizarEstadoLogistico,
  etiquetaPildoraPedido,
  obtenerSiguienteEstado,
};
