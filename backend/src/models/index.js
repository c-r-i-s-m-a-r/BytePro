const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Categoria = require('./Categoria')(sequelize, DataTypes);
const Producto = require('./Producto')(sequelize, DataTypes);
const Variante = require('./Variante')(sequelize, DataTypes);
const Inventario = require('./Inventario')(sequelize, DataTypes);
const Usuario = require('./Usuario')(sequelize, DataTypes);
const Cliente = require('./Cliente')(sequelize, DataTypes);
const Empleado = require('./Empleado')(sequelize, DataTypes);
const Direccion = require('./Direccion')(sequelize, DataTypes);
const Carrito = require('./Carrito')(sequelize, DataTypes);
const CarritoItem = require('./CarritoItem')(sequelize, DataTypes);
const Resena = require('./Resena')(sequelize, DataTypes);
const Venta = require('./Venta')(sequelize, DataTypes);
const VentaItem = require('./VentaItem')(sequelize, DataTypes);
const Checkout = require('./Checkout')(sequelize, DataTypes);
const CheckoutItem = require('./CheckoutItem')(sequelize, DataTypes);
const BloqueoStock = require('./BloqueoStock')(sequelize, DataTypes);
const Transaccion = require('./Transaccion')(sequelize, DataTypes);
const Recibo = require('./Recibo')(sequelize, DataTypes);
const Despacho = require('./Despacho')(sequelize, DataTypes);
const EventoAuditoria = require('./EventoAuditoria')(sequelize, DataTypes);
const Kardex = require('./Kardex')(sequelize, DataTypes);
const Reclamo = require('./Reclamo')(sequelize, DataTypes);

Categoria.hasMany(Producto, { foreignKey: 'categoriaId', as: 'productos' });
Producto.belongsTo(Categoria, { foreignKey: 'categoriaId', as: 'categoria' });
Categoria.belongsTo(Categoria, { foreignKey: 'parentId', as: 'padre' });
Categoria.hasMany(Categoria, { foreignKey: 'parentId', as: 'subcategorias' });

Producto.hasMany(Variante, { foreignKey: 'productoId', as: 'variantes', onDelete: 'CASCADE' });
Variante.belongsTo(Producto, { foreignKey: 'productoId', as: 'producto' });

Variante.hasOne(Inventario, { foreignKey: 'varianteId', as: 'inventario', onDelete: 'CASCADE' });
Inventario.belongsTo(Variante, { foreignKey: 'varianteId', as: 'variante' });

Usuario.hasOne(Cliente, { foreignKey: 'usuarioId', as: 'perfilCliente' });
Cliente.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });
Usuario.hasOne(Empleado, { foreignKey: 'usuarioId', as: 'perfilEmpleado' });
Empleado.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });

Usuario.hasMany(Direccion, { foreignKey: 'usuarioId', as: 'direcciones', onDelete: 'CASCADE' });
Direccion.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });

Usuario.hasMany(Carrito, { foreignKey: 'usuarioId', as: 'carritos' });
Carrito.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });
Carrito.hasMany(CarritoItem, { foreignKey: 'carritoId', as: 'items', onDelete: 'CASCADE' });
CarritoItem.belongsTo(Carrito, { foreignKey: 'carritoId', as: 'carrito' });
Variante.hasMany(CarritoItem, { foreignKey: 'varianteId', as: 'carritoItems' });
CarritoItem.belongsTo(Variante, { foreignKey: 'varianteId', as: 'variante' });

Producto.hasMany(Resena, { foreignKey: 'productoId', as: 'resenas', onDelete: 'CASCADE' });
Resena.belongsTo(Producto, { foreignKey: 'productoId', as: 'producto' });
Usuario.hasMany(Resena, { foreignKey: 'usuarioId', as: 'resenas' });
Resena.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });

Usuario.hasMany(Venta, { foreignKey: 'usuarioId', as: 'ventas' });
Venta.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });
Venta.hasMany(VentaItem, { foreignKey: 'ventaId', as: 'items', onDelete: 'CASCADE' });
VentaItem.belongsTo(Venta, { foreignKey: 'ventaId', as: 'venta' });
Variante.hasMany(VentaItem, { foreignKey: 'varianteId', as: 'ventaItems' });
VentaItem.belongsTo(Variante, { foreignKey: 'varianteId', as: 'variante' });

Usuario.hasMany(Checkout, { foreignKey: 'usuarioId', as: 'checkouts' });
Checkout.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });
Carrito.hasMany(Checkout, { foreignKey: 'carritoId', as: 'checkouts' });
Checkout.belongsTo(Carrito, { foreignKey: 'carritoId', as: 'carrito' });
Venta.hasOne(Checkout, { foreignKey: 'ventaId', as: 'checkout' });
Checkout.belongsTo(Venta, { foreignKey: 'ventaId', as: 'venta' });

Checkout.hasMany(CheckoutItem, { foreignKey: 'checkoutId', as: 'items', onDelete: 'CASCADE' });
CheckoutItem.belongsTo(Checkout, { foreignKey: 'checkoutId', as: 'checkout' });
Variante.hasMany(CheckoutItem, { foreignKey: 'varianteId', as: 'checkoutItems' });
CheckoutItem.belongsTo(Variante, { foreignKey: 'varianteId', as: 'variante' });

Checkout.hasMany(BloqueoStock, { foreignKey: 'checkoutId', as: 'bloqueos', onDelete: 'CASCADE' });
BloqueoStock.belongsTo(Checkout, { foreignKey: 'checkoutId', as: 'checkout' });
Variante.hasMany(BloqueoStock, { foreignKey: 'varianteId', as: 'bloqueosStock' });
BloqueoStock.belongsTo(Variante, { foreignKey: 'varianteId', as: 'variante' });

Venta.hasMany(Transaccion, { foreignKey: 'ventaId', as: 'transacciones' });
Transaccion.belongsTo(Venta, { foreignKey: 'ventaId', as: 'venta' });
Checkout.hasMany(Transaccion, { foreignKey: 'checkoutId', as: 'transacciones' });
Transaccion.belongsTo(Checkout, { foreignKey: 'checkoutId', as: 'checkout' });
Usuario.hasMany(Transaccion, { foreignKey: 'usuarioId', as: 'transacciones' });
Transaccion.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });

Venta.hasOne(Recibo, { foreignKey: 'ventaId', as: 'recibo' });
Recibo.belongsTo(Venta, { foreignKey: 'ventaId', as: 'venta' });
Transaccion.hasOne(Recibo, { foreignKey: 'transaccionId', as: 'recibo' });
Recibo.belongsTo(Transaccion, { foreignKey: 'transaccionId', as: 'transaccion' });

Venta.hasOne(Despacho, { foreignKey: 'ventaId', as: 'despacho' });
Despacho.belongsTo(Venta, { foreignKey: 'ventaId', as: 'venta' });

Venta.hasMany(EventoAuditoria, { foreignKey: 'ventaId', as: 'eventosAuditoria' });
EventoAuditoria.belongsTo(Venta, { foreignKey: 'ventaId', as: 'venta' });
Transaccion.hasMany(EventoAuditoria, { foreignKey: 'transaccionId', as: 'eventosAuditoria' });
EventoAuditoria.belongsTo(Transaccion, { foreignKey: 'transaccionId', as: 'transaccion' });
Usuario.hasMany(EventoAuditoria, { foreignKey: 'usuarioId', as: 'eventosAuditoria' });
EventoAuditoria.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });

Variante.hasMany(Kardex, { foreignKey: 'varianteId', as: 'movimientosKardex' });
Kardex.belongsTo(Variante, { foreignKey: 'varianteId', as: 'variante' });
Usuario.hasMany(Kardex, { foreignKey: 'usuarioId', as: 'movimientosKardex' });
Kardex.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });

Usuario.hasMany(Reclamo, { foreignKey: 'usuarioId', as: 'reclamos' });
Reclamo.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });
Usuario.hasMany(Reclamo, { foreignKey: 'empleadoAsignadoId', as: 'reclamosAsignados' });
Reclamo.belongsTo(Usuario, { foreignKey: 'empleadoAsignadoId', as: 'empleadoAsignado' });

async function ensureColumns(tableName, columns) {
  const [info] = await sequelize.query(`PRAGMA table_info(${tableName});`);
  const existing = new Set((info || []).map((col) => col.name));
  for (const [colName, colType] of Object.entries(columns)) {
    if (!existing.has(colName)) {
      // eslint-disable-next-line no-await-in-loop
      await sequelize.query(`ALTER TABLE ${tableName} ADD COLUMN ${colName} ${colType};`);
    }
  }
}

sequelize.addHook('afterBulkSync', async () => {
  try {
    await ensureColumns('despachos', {
      codigo_seguimiento: ' VARCHAR(40)',
      nombre_destinatario: ' VARCHAR(160)',
      direccion: ' VARCHAR(255)',
      ciudad: ' VARCHAR(100)',
      telefono: ' VARCHAR(40)',
      notas: ' VARCHAR(500)',
      ubicacion_actual: ' VARCHAR(160)',
      fecha_estimada: ' DATETIME',
      historial: ' TEXT',
    });

    await ensureColumns('checkouts', {
      nombre_destinatario: ' VARCHAR(160)',
      direccion: ' VARCHAR(255)',
      ciudad: ' VARCHAR(100)',
      telefono: ' VARCHAR(40)',
      notas: ' VARCHAR(500)',
    });

    await ensureColumns('usuarios', {
      roles: ' TEXT',
      funcion_activa: ' VARCHAR(40)',
    });

    await Reclamo.sync();

    // Backfill legacy dispatch rows or paid sales without tracking code
    const hoy = new Date();
    const ymd = `${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, '0')}${String(
      hoy.getDate()
    ).padStart(2, '0')}`;

    const ventasConPago = await Venta.findAll({
      where: { estado: ['pagada', 'enviada', 'entregada', 'cancelada', 'CANCELADO'] },
      include: [
        { model: Despacho, as: 'despacho' },
        { model: Usuario, as: 'usuario', include: [{ model: Cliente, as: 'perfilCliente' }] },
      ],
    });

    for (const venta of ventasConPago) {
      const code = `TRK-${ymd}-${String(venta.id).padStart(4, '0')}`;
      const nombreDest = (venta.usuario && venta.usuario.nombre) || 'Cliente BytePro';
      const dirCliente =
        (venta.usuario &&
          venta.usuario.perfilCliente &&
          venta.usuario.perfilCliente.direccion) ||
        'Av. Principal 123';
      const telCliente = (venta.usuario && venta.usuario.telefono) || '70000001';
      const fechaEst = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const estadoInicial =
        venta.estado === 'entregada'
          ? 'ENTREGADO'
          : venta.estado === 'enviada'
            ? 'EN_CAMINO'
            : venta.estado === 'cancelada' || venta.estado === 'CANCELADO'
              ? 'CANCELADO'
              : 'PEDIDO_CONFIRMADO';

      if (!venta.despacho) {
        // eslint-disable-next-line no-await-in-loop
        await Despacho.create({
          ventaId: venta.id,
          codigoSeguimiento: code,
          estado: estadoInicial,
          nombreDestinatario: nombreDest,
          direccion: dirCliente,
          ciudad: 'La Paz',
          telefono: telCliente,
          notas: 'Entrega estándar',
          ubicacionActual:
            estadoInicial === 'ENTREGADO'
              ? 'Domicilio del destinatario'
              : 'Centro de Distribución BytePro',
          fechaEstimada: fechaEst,
          historial: [
            {
              estado: 'PEDIDO_CONFIRMADO',
              timestamp: (venta.createdAt || hoy).toISOString(),
              ubicacion: 'Centro de Distribución BytePro',
              nota: 'Pago validado y orden recibida.',
            },
          ],
          nota: 'Pago confirmado.',
        });
      } else {
        const updates = {};
        if (!venta.despacho.codigoSeguimiento) updates.codigoSeguimiento = code;
        if (venta.despacho.estado === 'pendiente') updates.estado = 'PEDIDO_CONFIRMADO';
        if (venta.despacho.estado === 'preparando') updates.estado = 'EN_PREPARACION';
        if (venta.despacho.estado === 'enviado') updates.estado = 'EN_CAMINO';
        if (venta.despacho.estado === 'entregado') updates.estado = 'ENTREGADO';
        if (!venta.despacho.nombreDestinatario) updates.nombreDestinatario = nombreDest;
        if (!venta.despacho.direccion) updates.direccion = dirCliente;
        if (!venta.despacho.ciudad) updates.ciudad = 'La Paz';
        if (!venta.despacho.telefono) updates.telefono = telCliente;
        if (!venta.despacho.ubicacionActual) {
          updates.ubicacionActual = 'Centro de Distribución BytePro';
        }
        if (!venta.despacho.fechaEstimada) updates.fechaEstimada = fechaEst;
        if (!Array.isArray(venta.despacho.historial) || !venta.despacho.historial.length) {
          updates.historial = [
            {
              estado: updates.estado || venta.despacho.estado || 'PEDIDO_CONFIRMADO',
              timestamp: (venta.despacho.createdAt || hoy).toISOString(),
              ubicacion: 'Centro de Distribución BytePro',
              nota: venta.despacho.nota || 'Pago validado y orden recibida.',
            },
          ];
        }
        if (Object.keys(updates).length > 0) {
          // eslint-disable-next-line no-await-in-loop
          await venta.despacho.update(updates);
        }
      }
    }
  } catch (err) {
    // Non-fatal during partial syncs
  }
});

module.exports = {
  sequelize,
  Categoria,
  Producto,
  Variante,
  Inventario,
  Usuario,
  Cliente,
  Empleado,
  Direccion,
  Carrito,
  CarritoItem,
  Resena,
  Venta,
  VentaItem,
  Checkout,
  CheckoutItem,
  BloqueoStock,
  Transaccion,
  Recibo,
  Despacho,
  EventoAuditoria,
  Kardex,
  Reclamo,
};
