const AppError = require('./AppError');

// REQ-IMG-02: validación de imágenes de evidencia en backend.
const IMAGE_ERROR = 'Formato o tamaño de imagen no admitido';
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);

function bytesDeBase64(base64) {
  const limpio = String(base64 || '').replace(/\s/g, '');
  if (!limpio) return 0;
  const padding = (limpio.match(/=*$/) || [''])[0].length;
  return Math.floor((limpio.length * 3) / 4) - padding;
}

function firmaValida(mime, buffer) {
  if (!buffer || buffer.length < 12) return false;

  if (mime === 'image/jpeg' || mime === 'image/jpg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mime === 'image/png') {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }

  if (mime === 'image/webp') {
    return (
      buffer.slice(0, 4).toString('ascii') === 'RIFF' &&
      buffer.slice(8, 12).toString('ascii') === 'WEBP'
    );
  }

  return false;
}

function normalizarFoto(value) {
  if (value === undefined || value === null) return null;
  const texto = String(value).trim();
  if (!texto) return null;

  if (texto.startsWith('data:')) {
    const match = texto.match(/^data:([^;,]+);base64,([A-Za-z0-9+/=\s]+)$/i);
    if (!match) throw new AppError(IMAGE_ERROR, 400);

    const mime = match[1].toLowerCase();
    if (!IMAGE_MIME_TYPES.has(mime)) throw new AppError(IMAGE_ERROR, 400);

    const base64 = match[2].replace(/\s/g, '');
    if (bytesDeBase64(base64) > IMAGE_MAX_BYTES) throw new AppError(IMAGE_ERROR, 400);

    let buffer;
    try {
      buffer = Buffer.from(base64, 'base64');
    } catch (err) {
      throw new AppError(IMAGE_ERROR, 400);
    }

    if (!buffer.length || !firmaValida(mime, buffer)) {
      throw new AppError(IMAGE_ERROR, 400);
    }

    return texto;
  }

  if (texto.length > 2048) throw new AppError(IMAGE_ERROR, 400);
  if (!/^https?:\/\//i.test(texto) && !texto.startsWith('/uploads/')) {
    throw new AppError(IMAGE_ERROR, 400);
  }

  return texto;
}

function normalizarFotos(fotos) {
  const lista = Array.isArray(fotos) ? fotos : fotos ? [fotos] : [];
  const resultado = [];

  for (const item of lista) {
    const foto = normalizarFoto(item);
    if (foto && !resultado.includes(foto)) resultado.push(foto);
  }

  return resultado;
}

module.exports = {
  IMAGE_ERROR,
  IMAGE_MAX_BYTES,
  normalizarFoto,
  normalizarFotos,
};
