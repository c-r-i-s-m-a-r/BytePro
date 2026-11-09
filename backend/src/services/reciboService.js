const crypto = require('crypto');
const { Recibo } = require('../models');

function generarNumero() {
  const ahora = new Date();
  const periodo = `${ahora.getFullYear()}${String(ahora.getMonth() + 1).padStart(2, '0')}`;
  const sufijo = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `REC-${periodo}-${sufijo}`;
}

async function generarRecibo({ venta, checkout, transaccion, lineas, usuario, transaction = null }) {
  return Recibo.create(
    {
      ventaId: venta.id,
      transaccionId: transaccion.id,
      numero: generarNumero(),
      subtotal: checkout.subtotal,
      descuentoRetiro: checkout.descuentoRetiro || 0,
      descuentoPorcentaje: checkout.descuentoPorcentaje || 0,
      impuestos: checkout.impuestos,
      total: checkout.total,
      moneda: checkout.moneda,
      metodo: transaccion.metodo,
      codigoTransaccion: transaccion.codigoTransaccion,
      clienteNombre: usuario ? usuario.nombre : null,
      clienteEmail: usuario ? usuario.email : null,
      metodoEntrega: checkout.metodoEntrega || 'domicilio',
      sucursalNombre: checkout.sucursalNombre || null,
      sucursalCiudad: checkout.sucursalCiudad || null,
      sucursalDireccion: checkout.sucursalDireccion || null,
      sucursalTelefono: checkout.sucursalTelefono || null,
      sucursalHorarios: checkout.sucursalHorarios || null,
      items: (lineas || []).map((linea) => ({
        varianteId: linea.varianteId,
        sku: linea.sku,
        nombreProducto: linea.nombreProducto,
        nombreVariante: linea.nombreVariante,
        cantidad: linea.cantidad,
        precioUnitario: linea.precioUnitario,
        subtotal: linea.subtotal,
      })),
    },
    { transaction }
  );
}

module.exports = { generarRecibo };
