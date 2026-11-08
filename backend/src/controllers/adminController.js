const { Op } = require('sequelize');
const {
  Producto,
  Usuario,
  Empleado,
  Venta,
  VentaItem,
  Variante,
  Despacho,
  Recibo,
} = require('../models');
const cobroService = require('../services/cobroService');
const almacenService = require('../services/almacenService');
const distribucionService = require('../services/distribucionService');
const { hashPassword } = require('../utils/hash');
const AppError = require('../utils/AppError');
const { round2 } = require('../utils/money');

async function calcularResumenEjecutivo() {
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

  const [productos, usuarios, todasVentas, inventario, despachos] = await Promise.all([
    Producto.count({ where: { activo: true } }),
    Usuario.count({ where: { activo: true } }),
    Venta.findAll({
      where: { estado: { [Op.ne]: 'pendiente' } },
      include: [{ model: Despacho, as: 'despacho' }],
    }),
    almacenService.listarInventario(),
    Despacho.findAll(),
  ]);

  const ventasValidas = todasVentas.filter(
    (v) => !['cancelada', 'CANCELADO', 'pendiente'].includes(v.estado)
  );

  const ingresosAcumulados = round2(
    ventasValidas.reduce((sum, v) => sum + (Number(v.total) || 0), 0)
  );

  const ventasMesLista = ventasValidas.filter(
    (v) => new Date(v.createdAt) >= inicioMes
  );
  const ventasMes = round2(
    ventasMesLista.reduce((sum, v) => sum + (Number(v.total) || 0), 0)
  );

  const pedidosRealizados = todasVentas.length;
  const pedidosPendientesDespacho = despachos.filter((d) => {
    const est = distribucionService.normalizarEstadoLogistico(d.estado);
    return ['PEDIDO_CONFIRMADO', 'PREPARANDO_PEDIDO', 'EN_PREPARACION', 'EN_CAMINO'].includes(
      est
    );
  }).length;
  const pedidosEntregados = despachos.filter(
    (d) => distribucionService.normalizarEstadoLogistico(d.estado) === 'ENTREGADO'
  ).length;
  const pedidosCancelados = todasVentas.filter((v) =>
    ['cancelada', 'CANCELADO'].includes(v.estado)
  ).length;

  const stockTotal = inventario.reduce((sum, item) => sum + item.cantidad, 0);
  const stockDisponible = inventario.reduce((sum, item) => sum + item.disponible, 0);

  const alertasReabastecimiento = inventario.filter(
    (item) => item.critico || item.disponible <= 3
  );
  const stockBajo = alertasReabastecimiento.length;

  return {
    productos,
    productosCatalogo: productos,
    usuarios,
    ventas: pedidosRealizados,
    pedidosRealizados,
    pedidosPendientesDespacho,
    pedidosEntregados,
    pedidosCancelados,
    ingresosAcumulados,
    totalIngresos: ingresosAcumulados,
    ventasMes,
    ingresosMes: ventasMes,
    cantidadVentasMes: ventasMesLista.length,
    variantes: inventario.length,
    variantesActivas: inventario.length,
    stockTotal,
    stockDisponible,
    stockBajo,
    productosStockCritico: stockBajo,
    alertasReabastecimiento,
  };
}

async function resumen(req, res, next) {
  try {
    const data = await calcularResumenEjecutivo();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function inventario(req, res, next) {
  try {
    const items = await almacenService.listarInventario();
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

async function alertasStock(req, res, next) {
  try {
    const inventarioItems = await almacenService.listarInventario();
    const items = inventarioItems.filter(
      (item) => item.critico || item.disponible <= 3
    );
    res.json({ items, total: items.length });
  } catch (err) {
    next(err);
  }
}

async function pedidos(req, res, next) {
  try {
    const query = req.query || {};
    const page = Math.max(1, parseInt(query.page || query.pagina || '1', 10) || 1);
    const limit = Math.min(
      Math.max(parseInt(query.limit || query.pageSize || '20', 10) || 20, 1),
      100
    );

    const whereVenta = {
      estado: { [Op.ne]: 'pendiente' },
    };

    const rows = await Venta.findAll({
      where: whereVenta,
      include: [
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email'] },
        { model: Despacho, as: 'despacho' },
        { model: Recibo, as: 'recibo', attributes: ['id', 'numero', 'metodo'] },
        {
          model: VentaItem,
          as: 'items',
          include: [
            {
              model: Variante,
              as: 'variante',
              attributes: ['id', 'sku', 'nombre'],
              include: [{ model: Producto, as: 'producto', attributes: ['id', 'nombre'] }],
            },
          ],
        },
      ],
      order: [
        ['createdAt', 'DESC'],
        ['id', 'DESC'],
      ],
    });

    let lista = rows.map((venta) => {
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

      const estadoPago =
        venta.estado === 'cancelada' || venta.estado === 'CANCELADO'
          ? 'CANCELADO'
          : 'PAGADO';

      return {
        id: venta.id,
        pedidoId: venta.id,
        ventaId: venta.id,
        numeroPedido: `PED-${String(venta.id).padStart(4, '0')}`,
        cliente: venta.usuario
          ? {
              id: venta.usuario.id,
              nombre: venta.usuario.nombre,
              email: venta.usuario.email,
            }
          : { id: venta.usuarioId, nombre: 'Cliente', email: '—' },
        fecha: venta.createdAt,
        total: Number(venta.total),
        montoTotal: Number(venta.total),
        estado: venta.estado,
        estadoPago,
        estadoLogistica,
        pildora: distribucionService.etiquetaPildoraPedido(venta.estado, estadoLogistica),
        siguienteEstado: distribucionService.obtenerSiguienteEstado(estadoLogistica),
        codigoSeguimiento: despacho ? despacho.codigoSeguimiento : null,
        trackingCode: despacho ? despacho.codigoSeguimiento : null,
        ubicacionActual: despacho ? despacho.ubicacionActual : null,
        despacho,
        recibo: venta.recibo
          ? {
              id: venta.recibo.id,
              numero: venta.recibo.numero,
              metodo: venta.recibo.metodo,
            }
          : null,
        itemsCount: (venta.items || []).reduce(
          (sum, it) => sum + (Number(it.cantidad) || 0),
          0
        ),
      };
    });

    if (query.estadoLogistica) {
      const filtroLog = String(query.estadoLogistica).trim().toUpperCase();
      lista = lista.filter((p) => p.estadoLogistica === filtroLog);
    }

    const total = lista.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const items = lista.slice(start, start + limit);

    res.json({
      items,
      pagination: { page, limit, total, totalPages },
    });
  } catch (err) {
    next(err);
  }
}

async function actualizarEstadoPedido(req, res, next) {
  try {
    const idOrCodigo =
      req.params.ventaId ||
      req.params.id ||
      req.params.codigo ||
      (req.body && (req.body.codigoSeguimiento || req.body.ventaId || req.body.despachoId));
    const body = req.body || {};
    const nuevoEstado = body.estado || body.nuevoEstado || body.estadoLogistica || body.fase;

    const data = await distribucionService.actualizarEstadoDespacho({
      idOrCodigo,
      nuevoEstado,
      ubicacion: body.ubicacion || body.ubicacionActual || body.puntoControl,
      puntoControl: body.puntoControl || body.ubicacion,
      nota: body.nota || body.comentario,
      usuario: req.user,
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function usuarios(req, res, next) {
  try {
    // REQ-ADM-10: Exclusivamente empleados/personal corporativo (vendedor, soporte, operaciones, admin)
    // Los clientes/compradores no deben aparecer en esta lista ni mezclarse.
    const items = await Usuario.findAll({
      where: {
        rol: { [Op.in]: ['admin', 'empleado', 'vendedor', 'soporte', 'operaciones'] },
      },
      attributes: ['id', 'username', 'email', 'nombre', 'telefono', 'rol', 'roles', 'funcionActiva', 'activo', 'createdAt'],
      order: [['id', 'ASC']],
    });
    const safeItems = items.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      nombre: u.nombre,
      telefono: u.telefono,
      rol: u.rol,
      roles: u.getRolesList(),
      funcionActiva: u.getFuncionActivaEfectiva(),
      activo: u.activo,
      createdAt: u.createdAt,
    }));
    res.json({ items: safeItems });
  } catch (err) {
    next(err);
  }
}

async function crearUsuario(req, res, next) {
  try {
    const { username, email, password, nombre, telefono, rol, roles, puesto, ci } = req.body || {};
    if (!username || !email || !password || !nombre) {
      throw new AppError('Todos los campos básicos (username, email, password, nombre) son requeridos', 400);
    }

    const normEmail = String(email).trim().toLowerCase();
    const existing = await Usuario.findOne({
      where: {
        [Op.or]: [{ email: normEmail }, { username: String(username).trim() }],
      },
    });
    if (existing) {
      throw new AppError('El correo electrónico o nombre de usuario ya está registrado', 409);
    }

    const rawRoles = Array.isArray(roles) && roles.length > 0 ? roles : (rol ? [rol] : ['vendedor']);
    // Filtrar para asegurar que solo se asignen roles de empleados, nunca 'cliente'
    const assignedRoles = rawRoles.filter((r) => ['vendedor', 'soporte', 'operaciones', 'admin', 'empleado'].includes(r));
    if (assignedRoles.length === 0) {
      throw new AppError('Debes asignar al menos un rol corporativo de empleado (vendedor, soporte, operaciones o admin)', 400);
    }
    const primaryRol = assignedRoles[0];
    const passwordHash = await hashPassword(password);

    const nuevo = await Usuario.create({
      username: String(username).trim(),
      email: normEmail,
      passwordHash,
      nombre: String(nombre).trim(),
      telefono: telefono ? String(telefono).trim() : null,
      rol: primaryRol,
      roles: JSON.stringify(assignedRoles),
      funcionActiva: primaryRol,
      activo: true,
    });

    await Empleado.create({
      usuarioId: nuevo.id,
      puesto: puesto ? String(puesto).trim() : primaryRol,
      ci: ci ? String(ci).trim() : null,
    });

    res.status(201).json({ user: nuevo.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

async function actualizarUsuario(req, res, next) {
  try {
    const { id } = req.params;
    const user = await Usuario.findByPk(id);
    if (!user) throw new AppError('Usuario no encontrado', 404);

    const { nombre, telefono, rol, roles, funcionActiva, password, activo, puesto, ci } = req.body || {};

    if (nombre) user.nombre = String(nombre).trim();
    if (telefono !== undefined) user.telefono = telefono ? String(telefono).trim() : null;
    if (activo !== undefined) user.activo = Boolean(activo);

    if (Array.isArray(roles) && roles.length > 0) {
      user.roles = JSON.stringify(roles);
      user.rol = roles[0];
      if (!user.funcionActiva || !roles.includes(user.funcionActiva)) {
        user.funcionActiva = roles[0];
      }
    } else if (rol) {
      user.rol = rol;
      user.roles = JSON.stringify([rol]);
      user.funcionActiva = rol;
    }

    if (funcionActiva) {
      const allowed = user.getRolesList();
      if (allowed.includes(funcionActiva) || user.rol === 'admin') {
        user.funcionActiva = funcionActiva;
      }
    }

    if (password && String(password).trim().length >= 6) {
      user.passwordHash = await hashPassword(String(password).trim());
    }

    await user.save();

    if (user.rol !== 'cliente') {
      let emp = await Empleado.findOne({ where: { usuarioId: user.id } });
      if (!emp) {
        emp = await Empleado.create({ usuarioId: user.id });
      }
      if (puesto !== undefined) emp.puesto = puesto ? String(puesto).trim() : emp.puesto;
      if (ci !== undefined) emp.ci = ci ? String(ci).trim() : emp.ci;
      await emp.save();
    }

    res.json({ user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

async function eliminarUsuario(req, res, next) {
  try {
    const { id } = req.params;
    if (Number(id) === req.user.id) {
      throw new AppError('No puedes eliminar tu propia cuenta de administrador activa', 400);
    }
    const user = await Usuario.findByPk(id);
    if (!user) throw new AppError('Usuario no encontrado', 404);

    await Empleado.destroy({ where: { usuarioId: user.id } });
    await user.destroy();
    res.json({ success: true, message: 'Usuario eliminado correctamente' });
  } catch (err) {
    next(err);
  }
}

async function transacciones(req, res, next) {
  try {
    const items = await cobroService.listarTransacciones({ limit: 100 });
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

async function auditoria(req, res, next) {
  try {
    const items = await cobroService.listarAuditoria({ limit: 100 });
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  resumen,
  inventario,
  alertasStock,
  pedidos,
  actualizarEstadoPedido,
  usuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  transacciones,
  auditoria,
};
