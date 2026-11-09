function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function toCents(value) {
  return Math.round(Number(value) * 100);
}

function fromCents(value) {
  return round2(Number(value) / 100);
}

function formatearMonto(value, moneda = 'BOB') {
  const prefijo = moneda === 'BOB' ? 'Bs.' : moneda;
  return `${prefijo} ${round2(value).toFixed(2)}`;
}

module.exports = { round2, toCents, fromCents, formatearMonto };
