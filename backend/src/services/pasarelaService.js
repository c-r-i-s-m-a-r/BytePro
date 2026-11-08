const crypto = require('crypto');

const MOTIVOS_SIMULACION = {
  fondos: 'Fondos insuficientes',
  fraude: 'Transacción rechazada por sospecha de fraude',
  red: 'Error de red bancaria. Intenta nuevamente',
};

function generarCodigo(metodo) {
  const prefijo = metodo === 'tarjeta' ? 'CARD' : metodo === 'transferencia' ? 'TRF' : 'PGW';
  return `${prefijo}-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function generarReferencia(proveedor) {
  return `${String(proveedor || 'sandbox').toUpperCase()}-${crypto
    .randomBytes(6)
    .toString('hex')
    .toUpperCase()}`;
}

async function procesar({ metodo, monto, moneda, datosPago, ventaId }) {
  const datos = datosPago || {};
  const simulacion = typeof datos.simulacion === 'string' ? datos.simulacion : 'aprobado';
  const proveedor =
    datos.proveedor || (metodo === 'tarjeta' ? 'tarjeta-sandbox' : metodo === 'transferencia' ? 'banco-sandbox' : 'sandbox');

  let estado = 'aprobado';
  let motivoRechazo = null;
  let montoCobrado = Number(monto);

  if (simulacion === 'discrepancia') {
    estado = 'discrepancia';
    montoCobrado = Number((Number(monto) + 1).toFixed(2));
    motivoRechazo = 'El monto cobrado no coincide con el total de la orden';
  } else if (MOTIVOS_SIMULACION[simulacion]) {
    estado = 'rechazado';
    motivoRechazo = MOTIVOS_SIMULACION[simulacion];
  }

  if (estado === 'aprobado' && datos.ultimos4) {
    if (datos.ultimos4 === '0002') {
      estado = 'rechazado';
      motivoRechazo = 'Fondos insuficientes';
    } else if (datos.ultimos4 === '0003') {
      estado = 'rechazado';
      motivoRechazo = 'Transacción rechazada por sospecha de fraude';
    } else if (datos.ultimos4 === '0004') {
      estado = 'rechazado';
      motivoRechazo = 'Error de red bancaria. Intenta nuevamente';
    }
  }

  return {
    estado,
    motivoRechazo,
    montoCobrado,
    codigoTransaccion: generarCodigo(metodo),
    referenciaExterna: generarReferencia(proveedor),
    proveedor,
    payload: {
      metodo,
      moneda,
      monto: Number(monto),
      montoCobrado,
      simulacion,
      proveedor,
      ventaId,
      timestamp: new Date().toISOString(),
    },
  };
}

module.exports = { procesar };
