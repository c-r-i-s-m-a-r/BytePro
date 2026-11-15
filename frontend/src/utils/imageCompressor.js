// REQ-IMG-01: compresión de imágenes en el cliente mediante Canvas/Web API.
const DEFAULT_MAX_SIDE = 1280;
const DEFAULT_QUALITY = 0.8;
const DEFAULT_MIME_TYPE = 'image/jpeg';
const DEFAULT_MAX_BYTES = 300 * 1024;
const MIN_QUALITY = 0.5;
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;

export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const MAX_SOURCE_IMAGE_BYTES = MAX_SOURCE_BYTES;

export function isSupportedImageType(file) {
  if (!file) return false;
  return SUPPORTED_IMAGE_TYPES.includes(String(file.type || '').toLowerCase());
}

function calcularDimensiones(anchoOriginal, altoOriginal, maxSide) {
  const ancho = Number(anchoOriginal) || 0;
  const alto = Number(altoOriginal) || 0;
  if (!ancho || !alto) return { width: 0, height: 0 };

  const ladoMayor = Math.max(ancho, alto);
  if (ladoMayor <= maxSide) return { width: ancho, height: alto };

  const escala = maxSide / ladoMayor;
  return {
    width: Math.max(1, Math.round(ancho * escala)),
    height: Math.max(1, Math.round(alto * escala)),
  };
}

function bytesDeDataUrl(dataUrl) {
  const texto = String(dataUrl || '');
  const indice = texto.indexOf(',');
  if (indice < 0) return 0;
  const base64 = texto.slice(indice + 1).replace(/\s/g, '');
  if (!base64) return 0;
  const padding = (base64.match(/=*$/) || [''])[0].length;
  return Math.floor((base64.length * 3) / 4) - padding;
}

function cargarImagen(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo procesar la imagen seleccionada'));
    };

    img.src = url;
  });
}

/**
 * Comprime un File/Blob de imagen y devuelve una DataURL optimizada.
 * - Redimensiona proporcionalmente a `maxSide` (1280 px por defecto).
 * - Exporta JPEG con calidad 0.8 y la reduce gradualmente si supera `maxBytes`.
 */
export async function compressImage(file, options = {}) {
  if (!file) throw new Error('No se recibió ninguna imagen');

  const {
    maxSide = DEFAULT_MAX_SIDE,
    quality = DEFAULT_QUALITY,
    mimeType = DEFAULT_MIME_TYPE,
    maxBytes = DEFAULT_MAX_BYTES,
  } = options;

  if (!isSupportedImageType(file)) {
    throw new Error('El formato debe ser PNG, JPEG o WEBP');
  }

  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('La imagen original supera el tamaño máximo permitido');
  }

  const img = await cargarImagen(file);
  const { width, height } = calcularDimensiones(img.naturalWidth, img.naturalHeight, maxSide);
  if (!width || !height) {
    throw new Error('No se pudo determinar el tamaño de la imagen');
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('El navegador no permite procesar imágenes');

  // Fondo blanco para evitar transparencias negras al exportar JPEG.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  let calidad = quality;
  let dataUrl = canvas.toDataURL(mimeType, calidad);

  while (bytesDeDataUrl(dataUrl) > maxBytes && calidad > MIN_QUALITY) {
    calidad = Math.max(MIN_QUALITY, Number((calidad - 0.1).toFixed(2)));
    dataUrl = canvas.toDataURL(mimeType, calidad);
  }

  return dataUrl;
}

export async function compressImages(files, options = {}) {
  const lista = Array.from(files || []);
  const resultados = [];
  for (const file of lista) {
    // eslint-disable-next-line no-await-in-loop
    resultados.push(await compressImage(file, options));
  }
  return resultados;
}
