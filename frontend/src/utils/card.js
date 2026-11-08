export function onlyDigits(value) {
  return String(value === null || value === undefined ? '' : value).replace(/\D/g, '');
}

export function formatCardNumber(value) {
  return onlyDigits(value).slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
}

export function luhnCheck(numero) {
  const digits = onlyDigits(numero);
  if (digits.length < 12 || digits.length > 19) return false;

  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = parseInt(digits[i], 10);
    if (alternate) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

export function detectBrand(numero) {
  const digits = onlyDigits(numero);
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'American Express';
  if (/^6(?:011|5)/.test(digits)) return 'Discover';
  return 'Tarjeta';
}

export function validateExpiry(mes, anio) {
  const m = parseInt(mes, 10);
  let y = parseInt(anio, 10);
  if (!Number.isInteger(m) || !Number.isInteger(y)) return false;
  if (m < 1 || m > 12) return false;
  if (y < 100) y += 2000;

  const now = new Date();
  const finDeMes = new Date(y, m, 1);
  const inicioMesActual = new Date(now.getFullYear(), now.getMonth(), 1);
  return finDeMes > inicioMesActual;
}

export function validateCvv(cvv) {
  return /^\d{3,4}$/.test(String(cvv === null || cvv === undefined ? '' : cvv));
}

function randomToken() {
  if (typeof crypto !== 'undefined') {
    if (typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID().replace(/-/g, '');
    }
    if (typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    }
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

export function tokenizeCard({ numero, titular }) {
  const digits = onlyDigits(numero);
  return {
    tokenTarjeta: `tok_${randomToken()}`,
    ultimos4: digits.slice(-4),
    marca: detectBrand(digits),
    titular: titular ? titular.trim().slice(0, 120) : null,
  };
}

export function generatePaymentToken(prefix = 'sb') {
  return `${prefix}_${randomToken()}`;
}
