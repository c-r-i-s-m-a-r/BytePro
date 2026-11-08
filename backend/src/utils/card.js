function onlyDigits(value) {
  return String(value === null || value === undefined ? '' : value).replace(/\D/g, '');
}

function luhnCheck(numero) {
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

function detectBrand(numero) {
  const digits = onlyDigits(numero);
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'American Express';
  if (/^6(?:011|5)/.test(digits)) return 'Discover';
  return 'Tarjeta';
}

function isValidExpiry(mes, anio) {
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

function isValidCvv(cvv) {
  return /^\d{3,4}$/.test(String(cvv === null || cvv === undefined ? '' : cvv));
}

function isValidToken(token) {
  return typeof token === 'string' && /^tok_[A-Za-z0-9_-]{8,120}$/.test(token);
}

function isValidTokenPasarela(token) {
  return typeof token === 'string' && /^(tok|sb)_[A-Za-z0-9_-]{6,120}$/.test(token);
}

module.exports = {
  onlyDigits,
  luhnCheck,
  detectBrand,
  isValidExpiry,
  isValidCvv,
  isValidToken,
  isValidTokenPasarela,
};
