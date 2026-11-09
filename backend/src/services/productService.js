const { Op } = require('sequelize');
const {
  Producto,
  Categoria,
  Variante,
  Inventario,
  Resena,
  Usuario,
  Kardex,
} = require('../models');
const AppError = require('../utils/AppError');
const { sanitizeSearch, escapeLike, slugify } = require('../utils/sanitize');
const env = require('../config/env');

const RESERVED_QUERY_KEYS = new Set([
  'q',
  'search',
  'busqueda',
  'categoria',
  'categoriaId',
  'marca',
  'precioMin',
  'precioMax',
  'orden',
  'sort',
  'page',
  'pagina',
  'limit',
  'pageSize',
]);

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);
const IMAGE_ERROR = 'El formato debe ser PNG, JPEG o WEBP y no superar los 5 MB';

function bytesDeBase64(base64) {
  const limpio = String(base64 || '').replace(/\s/g, '');
  const padding = (limpio.match(/=*$/) || [''])[0].length;
  return Math.floor((limpio.length * 3) / 4) - padding;
}

function normalizarImagen(value) {
  if (value === undefined || value === null) return null;
  const texto = String(value).trim();
  if (!texto) return null;

  if (texto.startsWith('data:')) {
    const match = texto.match(/^data:([^;,]+);base64,([A-Za-z0-9+/=\s]+)$/i);
    if (!match) throw new AppError(IMAGE_ERROR, 400);
    const mime = match[1].toLowerCase();
    if (!IMAGE_MIME_TYPES.has(mime)) throw new AppError(IMAGE_ERROR, 400);
    if (bytesDeBase64(match[2]) > IMAGE_MAX_BYTES) throw new AppError(IMAGE_ERROR, 400);
    return texto;
  }

  if (texto.length > 2048) {
    throw new AppError('La URL de imagen no puede superar los 2048 caracteres', 400);
  }
  if (!/^https?:\/\//i.test(texto) && !texto.startsWith('/uploads/')) {
    throw new AppError('La URL de imagen no es válida', 400);
  }
  return texto;
}

function normalizarImagenes(imagenes, imagenPrincipal = null) {
  const lista = Array.isArray(imagenes) ? imagenes : imagenes ? [imagenes] : [];
  const resultado = [];
  for (const item of lista) {
    const imagen = normalizarImagen(item);
    if (imagen && !resultado.includes(imagen)) resultado.push(imagen);
  }
  if (imagenPrincipal && !resultado.includes(imagenPrincipal)) {
    resultado.unshift(imagenPrincipal);
  }
  return resultado;
}

function normalizarObjeto(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch (e) {
      return {};
    }
  }
  return {};
}

function stockOf(variante) {
  if (!variante) return 0;
  const cantidad = variante.inventario ? variante.inventario.cantidad : 0;
  return Number.isFinite(cantidad) ? cantidad : 0;
}

function totalStock(producto) {
  const variantes = producto.variantes || [];
  if (!variantes.length) return 0;
  return variantes
    .filter((v) => v.activo !== false)
    .reduce((sum, v) => sum + stockOf(v), 0);
}

function serializeVariante(variante, producto) {
  const stock = stockOf(variante);
  return {
    id: variante.id,
    sku: variante.sku,
    ean: variante.ean,
    nombre: variante.nombre,
    atributos: variante.atributos || {},
    precio:
      variante.precioVenta !== null && variante.precioVenta !== undefined
        ? Number(variante.precioVenta)
        : Number(producto.precioVenta),
    imagenes: variante.imagenes || [],
    imagen: (variante.imagenes && variante.imagenes[0]) || null,
    stock,
    disponible: variante.activo !== false && stock > 0,
    activo: variante.activo !== false,
  };
}

function serializeProducto(producto) {
  const variantes = (producto.variantes || []).map((v) => serializeVariante(v, producto));
  const stock = variantes
    .filter((v) => v.activo)
    .reduce((sum, v) => sum + v.stock, 0);

  return {
    id: producto.id,
    nombre: producto.nombre,
    marca: producto.marca,
    modelo: producto.modelo,
    slug: producto.slug,
    descripcion: producto.descripcion,
    categoria: producto.categoria
      ? {
          id: producto.categoria.id,
          nombre: producto.categoria.nombre,
          slug: producto.categoria.slug,
          atributos: producto.categoria.atributos || [],
        }
      : null,
    precio: Number(producto.precioVenta),
    precioCompra: Number(producto.precioCompra),
    garantiaMeses: producto.garantiaMeses,
    especificaciones: producto.especificaciones || {},
    imagenes: producto.imagenes || [],
    imagenPrincipal:
      producto.imagenPrincipal || (producto.imagenes && producto.imagenes[0]) || null,
    imagen:
      producto.imagenPrincipal || (producto.imagenes && producto.imagenes[0]) || null,
    puntajePromedio: Number(producto.puntajePromedio || 0),
    totalResenas: Number(producto.totalResenas || 0),
    stock,
    disponible: stock > 0,
    variantes,
  };
}

function esPublicable(producto) {
  if (!producto.categoriaId || !producto.categoria) {
    // eslint-disable-next-line no-console
    console.warn(`[catalogo] Producto ${producto.id} excluido: sin categoría válida`);
    return false;
  }
  const specs = producto.especificaciones || {};
  const requeridos = (producto.categoria.atributos || []).filter((a) => a.requerido);
  if ((!specs || Object.keys(specs).length === 0) && requeridos.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(`[catalogo] Producto ${producto.id} excluido: sin atributos técnicos`);
    return false;
  }
  const faltantes = requeridos.filter((a) => {
    const value = specs[a.clave];
    return value === undefined || value === null || value === '';
  });
  if (faltantes.length) {
    // eslint-disable-next-line no-console
    console.warn(
      `[catalogo] Producto ${producto.id} excluido: atributos obligatorios vacíos (${faltantes
        .map((a) => a.clave)
        .join(', ')})`
    );
    return false;
  }
  return true;
}

function buildAttributeFilters(query) {
  const filters = {};
  Object.keys(query).forEach((key) => {
    if (key.startsWith('attr_')) {
      const clave = key.slice(5);
      const raw = query[key];
      if (raw === undefined || raw === null || raw === '') return;
      filters[clave] = String(raw)
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
    }
  });
  return filters;
}

function matchAttribute(specValue, wanted) {
  if (specValue === undefined || specValue === null) return false;
  const candidates = Array.isArray(specValue) ? specValue : [specValue];
  return wanted.some((w) =>
    candidates.some((c) => {
      if (typeof c === 'number' || typeof c === 'boolean') {
        return String(c) === String(w);
      }
      return String(c).toLowerCase() === String(w).toLowerCase();
    })
  );
}

function sortProducts(items, orden) {
  const list = [...items];
  switch (orden) {
    case 'precio_asc':
    case 'menor_precio':
      return list.sort((a, b) => a.precio - b.precio);
    case 'precio_desc':
    case 'mayor_precio':
      return list.sort((a, b) => b.precio - a.precio);
    case 'mejor_valorados':
      return list.sort(
        (a, b) =>
          b.puntajePromedio - a.puntajePromedio || b.totalResenas - a.totalResenas
      );
    case 'recientes':
    default:
      return list.sort((a, b) => b.id - a.id);
  }
}

async function resolveCategoria(value) {
  if (value === undefined || value === null || value === '') return null;
  const id = num(value);
  const where = id !== null ? { [Op.or]: [{ id }, { slug: String(value) }] } : { slug: String(value) };
  return Categoria.findOne({ where });
}

async function listProductos(query = {}) {
  const where = {
    activo: true,
    categoriaId: { [Op.ne]: null },
  };

  const categoria = await resolveCategoria(query.categoria ?? query.categoriaId);
  if (query.categoria || query.categoriaId) {
    if (!categoria) {
      return {
        items: [],
        pagination: { page: 1, limit: env.pageSizeDefault, total: 0, totalPages: 0 },
        facetas: { marcas: [] },
      };
    }
    where.categoriaId = categoria.id;
  }

  const marcasFaceta = await Producto.findAll({
    attributes: ['marca'],
    where: { activo: true, categoriaId: where.categoriaId },
    group: ['marca'],
    order: [['marca', 'ASC']],
    raw: true,
  });

  if (query.marca) {
    where.marca = String(query.marca);
  }

  const precioMin = num(query.precioMin);
  const precioMax = num(query.precioMax);
  if (precioMin !== null || precioMax !== null) {
    where.precioVenta = {};
    if (precioMin !== null) where.precioVenta[Op.gte] = precioMin;
    if (precioMax !== null) where.precioVenta[Op.lte] = precioMax;
  }

  const q = sanitizeSearch(query.q || query.search || query.busqueda || '');
  if (q) {
    const like = `%${escapeLike(q)}%`;
    where[Op.and] = [
      {
        [Op.or]: [
          { nombre: { [Op.like]: like } },
          { modelo: { [Op.like]: like } },
          { marca: { [Op.like]: like } },
          { descripcion: { [Op.like]: like } },
          { especificaciones: { [Op.like]: like } },
        ],
      },
    ];
  }

  const rows = await Producto.findAll({
    where,
    include: [
      {
        model: Categoria,
        as: 'categoria',
        attributes: ['id', 'nombre', 'slug', 'atributos'],
      },
      {
        model: Variante,
        as: 'variantes',
        required: false,
        where: { activo: true },
        include: [{ model: Inventario, as: 'inventario' }],
      },
    ],
    order: [['id', 'DESC']],
  });

  let products = rows.map((r) => r.get({ plain: true })).filter(esPublicable);

  const attributeFilters = buildAttributeFilters(query);
  const attrEntries = Object.entries(attributeFilters);
  if (attrEntries.length) {
    products = products.filter((p) =>
      attrEntries.every(([clave, wanted]) =>
        matchAttribute((p.especificaciones || {})[clave], wanted)
      )
    );
  }

  products = sortProducts(products.map(serializeProducto), query.orden || query.sort);

  const page = Math.max(1, parseInt(query.page || query.pagina || '1', 10) || 1);
  const requestedLimit = parseInt(query.limit || query.pageSize || env.pageSizeDefault, 10);
  const limit = Math.min(
    Math.max(Number.isFinite(requestedLimit) ? requestedLimit : env.pageSizeDefault, 1),
    env.pageSizeMax
  );
  const total = products.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const items = products.slice(start, start + limit);

  return {
    items,
    pagination: { page, limit, total, totalPages },
    facetas: { marcas: marcasFaceta.map((m) => m.marca) },
  };
}

async function getProducto(idOrSlug) {
  const id = num(idOrSlug);
  const where =
    id !== null
      ? { [Op.or]: [{ id }, { slug: String(idOrSlug) }] }
      : { slug: String(idOrSlug) };

  const producto = await Producto.findOne({
    where,
    include: [
      {
        model: Categoria,
        as: 'categoria',
        attributes: ['id', 'nombre', 'slug', 'atributos'],
      },
      {
        model: Variante,
        as: 'variantes',
        required: false,
        where: { activo: true },
        include: [{ model: Inventario, as: 'inventario' }],
      },
      {
        model: Resena,
        as: 'resenas',
        required: false,
        include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] }],
      },
    ],
    order: [[{ model: Resena, as: 'resenas' }, 'createdAt', 'DESC']],
  });

  if (!producto || !producto.activo) {
    throw new AppError('Producto no encontrado', 404);
  }

  const plain = producto.get({ plain: true });
  const serialized = serializeProducto(plain);
  serialized.resenas = (plain.resenas || []).map((r) => ({
    id: r.id,
    calificacion: r.calificacion,
    comentario: r.comentario,
    compraVerificada: r.compraVerificada,
    autor: r.usuario ? r.usuario.nombre : 'Cliente',
    fecha: r.createdAt,
  }));
  return serialized;
}

async function comparar(idsParam) {
  const ids = [
    ...new Set(
      String(idsParam || '')
        .split(',')
        .map((v) => parseInt(v, 10))
        .filter((v) => Number.isInteger(v) && v > 0)
    ),
  ];

  if (ids.length < 2) {
    throw new AppError('Selecciona al menos 2 productos para comparar', 400);
  }
  if (ids.length > 4) {
    throw new AppError('Solo es posible comparar hasta 4 productos a la vez', 400);
  }

  const rows = await Producto.findAll({
    where: { id: { [Op.in]: ids }, activo: true },
    include: [
      { model: Categoria, as: 'categoria', attributes: ['id', 'nombre', 'slug'] },
      {
        model: Variante,
        as: 'variantes',
        required: false,
        where: { activo: true },
        include: [{ model: Inventario, as: 'inventario' }],
      },
    ],
  });

  if (rows.length !== ids.length) {
    throw new AppError('Alguno de los productos solicitados no existe', 404);
  }

  const categorias = new Set(rows.map((r) => r.categoriaId));
  if (categorias.size > 1) {
    throw new AppError(
      'Solo es posible comparar productos de la misma categoría de hardware',
      400
    );
  }

  const productos = rows.map((r) => serializeProducto(r.get({ plain: true })));

  const specKeys = [];
  productos.forEach((p) => {
    Object.keys(p.especificaciones || {}).forEach((k) => {
      if (!specKeys.includes(k)) specKeys.push(k);
    });
  });

  const filas = [
    {
      atributo: 'Precio',
      tipo: 'precio',
      valores: productos.map((p) => p.precio),
    },
    {
      atributo: 'Garantía (meses)',
      tipo: 'garantia',
      valores: productos.map((p) => p.garantiaMeses),
    },
    {
      atributo: 'Disponibilidad',
      tipo: 'stock',
      valores: productos.map((p) => p.stock),
    },
    ...specKeys.map((key) => ({
      atributo: key,
      tipo: 'especificacion',
      valores: productos.map((p) => {
        const v = (p.especificaciones || {})[key];
        return v === undefined ? null : v;
      }),
    })),
  ];

  return {
    categoria: productos[0].categoria,
    productos,
    filas,
  };
}

async function crearProducto(payload) {
  const {
    nombre,
    marca,
    modelo,
    descripcion,
    categoriaId,
    precioCompra = 0,
    precioVenta,
    precioBase,
    precio,
    garantiaMeses = 12,
    especificaciones = {},
    imagenes = [],
    imagenPrincipal = null,
    imagen = null,
    variantes = [],
  } = payload || {};

  if (!nombre || !marca) {
    throw new AppError('Nombre y marca son obligatorios', 400);
  }
  const categoria = await Categoria.findByPk(categoriaId);
  if (!categoria) throw new AppError('Categoría no válida', 400);

  const precioVentaFinal = Math.max(0, num(precioVenta ?? precioBase ?? precio ?? 0) ?? 0);
  const precioCompraFinal = Math.max(0, num(precioCompra) ?? 0);
  const imagenFinal = normalizarImagen(imagenPrincipal ?? imagen);
  const imagenesFinales = normalizarImagenes(imagenes, imagenFinal);
  const especificacionesFinales = normalizarObjeto(especificaciones);

  const slug = await uniqueSlug(nombre);
  const slugBase =
    slug
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '')
      .slice(0, 20) || 'PRODUCTO';

  const producto = await Producto.create({
    nombre,
    marca,
    modelo,
    slug,
    descripcion,
    categoriaId: categoria.id,
    precioCompra: precioCompraFinal,
    precioVenta: precioVentaFinal,
    garantiaMeses,
    especificaciones: especificacionesFinales,
    imagenes: imagenesFinales,
    imagenPrincipal: imagenFinal,
    activo: true,
  });

  const variantesData =
    Array.isArray(variantes) && variantes.length
      ? variantes
      : [
          {
            sku: `${slugBase}-BASE`,
            nombre: 'Estándar',
            atributos: {},
            cantidad: 0,
          },
        ];

  for (let index = 0; index < variantesData.length; index += 1) {
    const v = variantesData[index] || {};
    const skuSolicitado = String(v.sku || '').trim() || `${slugBase}-${index + 1}`;
    // eslint-disable-next-line no-await-in-loop
    const sku = await uniqueSku(skuSolicitado);
    const imagenesVariante = normalizarImagenes(v.imagenes, null);

    // eslint-disable-next-line no-await-in-loop
    const variante = await Variante.create({
      productoId: producto.id,
      sku,
      ean: v.ean || null,
      nombre: v.nombre || 'Estándar',
      atributos: normalizarObjeto(v.atributos),
      precioVenta: num(v.precioVenta ?? v.precio) ?? precioVentaFinal,
      precioCompra: num(v.precioCompra) ?? precioCompraFinal,
      imagenes: imagenesVariante.length ? imagenesVariante : imagenesFinales,
      activo: true,
    });

    const cantidadInicial = Math.max(0, num(v.cantidad ?? v.stock) ?? 0);
    const umbralBajo = Math.max(0, num(v.umbralBajo) ?? 5);
    // eslint-disable-next-line no-await-in-loop
    await Inventario.create({
      varianteId: variante.id,
      cantidad: cantidadInicial,
      ubicacion: v.ubicacion || null,
      umbralBajo,
    });
    if (cantidadInicial > 0) {
      // eslint-disable-next-line no-await-in-loop
      await Kardex.create({
        varianteId: variante.id,
        tipo: 'ENTRADA',
        cantidad: cantidadInicial,
        stockAnterior: 0,
        stockResultante: cantidadInicial,
        motivo: 'Carga inicial de inventario',
        referencia: `producto:${producto.id}`,
      });
    }
  }

  return getProducto(producto.id);
}

async function uniqueSku(base) {
  const limpio =
    String(base || '')
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, '')
      .slice(0, 64) || 'SKU';
  let candidate = limpio;
  let counter = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await Variante.findOne({ where: { sku: candidate } })) {
    const suffix = `-${counter}`;
    candidate = `${limpio.slice(0, 64 - suffix.length)}${suffix}`;
    counter += 1;
  }
  return candidate;
}

async function uniqueSlug(nombre) {
  const base = slugify(nombre);
  let candidate = base;
  let counter = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await Producto.findOne({ where: { slug: candidate } })) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  return candidate;
}

async function actualizarProducto(id, payload) {
  const producto = await Producto.findByPk(id);
  if (!producto) throw new AppError('Producto no encontrado', 404);

  const campos = [
    'nombre',
    'marca',
    'modelo',
    'descripcion',
    'categoriaId',
    'precioCompra',
    'precioVenta',
    'garantiaMeses',
    'activo',
  ];
  const cambios = {};
  campos.forEach((campo) => {
    if (payload[campo] !== undefined) cambios[campo] = payload[campo];
  });

  if (payload.precioBase !== undefined && payload.precioVenta === undefined) {
    cambios.precioVenta = payload.precioBase;
  }
  if (
    payload.precio !== undefined &&
    payload.precioVenta === undefined &&
    payload.precioBase === undefined
  ) {
    cambios.precioVenta = payload.precio;
  }
  if (cambios.precioVenta !== undefined) {
    cambios.precioVenta = Math.max(0, num(cambios.precioVenta) ?? 0);
  }
  if (cambios.precioCompra !== undefined) {
    cambios.precioCompra = Math.max(0, num(cambios.precioCompra) ?? 0);
  }
  if (payload.especificaciones !== undefined) {
    cambios.especificaciones = normalizarObjeto(payload.especificaciones);
  }

  if (cambios.categoriaId !== undefined) {
    const categoria = await Categoria.findByPk(cambios.categoriaId);
    if (!categoria) throw new AppError('Categoría no válida', 400);
  }

  if (payload.imagenes !== undefined) {
    const lista = Array.isArray(payload.imagenes)
      ? payload.imagenes.map((img) => normalizarImagen(img)).filter(Boolean)
      : (payload.imagenes ? [normalizarImagen(payload.imagenes)].filter(Boolean) : []);
    cambios.imagenes = lista;
    if (payload.imagenPrincipal !== undefined) {
      cambios.imagenPrincipal = normalizarImagen(payload.imagenPrincipal);
    } else {
      cambios.imagenPrincipal = lista[0] || null;
    }
  } else {
    const imagenEntrada = payload.imagenPrincipal ?? payload.imagen;
    if (imagenEntrada !== undefined) {
      const normalizada = normalizarImagen(imagenEntrada);
      cambios.imagenPrincipal = normalizada;
      if (normalizada) {
        const actuales = Array.isArray(producto.imagenes) ? producto.imagenes : [];
        cambios.imagenes = normalizarImagenes([normalizada, ...actuales], normalizada);
      } else {
        cambios.imagenes = [];
      }
    }
  }

  await producto.update(cambios);

  if (Array.isArray(payload.variantes)) {
    const slugBase =
      (producto.slug || 'VAR')
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '')
        .slice(0, 20) || 'VAR';

    const existentes = await Variante.findAll({
      where: { productoId: producto.id },
      include: [{ model: Inventario, as: 'inventario' }],
    });
    const mapaExistentes = new Map(existentes.map((v) => [v.id, v]));
    const mapaPorSku = new Map(existentes.map((v) => [v.sku, v]));
    const idsProcesados = new Set();

    for (let index = 0; index < payload.variantes.length; index += 1) {
      const vData = payload.variantes[index] || {};
      const precioV =
        vData.precio !== undefined
          ? num(vData.precio)
          : vData.precioVenta !== undefined
          ? num(vData.precioVenta)
          : num(cambios.precioVenta ?? producto.precioVenta);
      const cantidad = Math.max(0, num(vData.stock ?? vData.cantidad) ?? 0);
      const atributos = normalizarObjeto(vData.atributos);
      const nombreVar = String(vData.nombre || '').trim() || 'Estándar';

      let varExistente = null;
      const varId = Number(vData.id);
      if (varId && mapaExistentes.has(varId)) {
        varExistente = mapaExistentes.get(varId);
      } else if (vData.sku && mapaPorSku.has(String(vData.sku).trim())) {
        varExistente = mapaPorSku.get(String(vData.sku).trim());
      }

      if (varExistente) {
        idsProcesados.add(varExistente.id);

        let skuFinal = varExistente.sku;
        const skuSolicitado = String(vData.sku || '').trim();
        if (skuSolicitado && skuSolicitado !== varExistente.sku) {
          skuFinal = await uniqueSku(skuSolicitado);
        }

        await varExistente.update({
          nombre: nombreVar,
          sku: skuFinal,
          precioVenta: precioV,
          atributos,
          activo: true,
        });

        let inventario = varExistente.inventario;
        if (!inventario) {
          inventario = await Inventario.findOne({ where: { varianteId: varExistente.id } });
        }
        if (inventario) {
          const stockAnterior = inventario.cantidad;
          if (stockAnterior !== cantidad) {
            await inventario.update({ cantidad });
            await Kardex.create({
              varianteId: varExistente.id,
              tipo: cantidad > stockAnterior ? 'ENTRADA' : 'AJUSTE',
              cantidad: Math.abs(cantidad - stockAnterior),
              stockAnterior,
              stockResultante: cantidad,
              motivo: 'Ajuste de inventario en edición de producto',
              referencia: `producto:${producto.id}`,
            });
          }
        } else {
          await Inventario.create({
            varianteId: varExistente.id,
            cantidad,
            umbralBajo: 5,
          });
          if (cantidad > 0) {
            await Kardex.create({
              varianteId: varExistente.id,
              tipo: 'ENTRADA',
              cantidad,
              stockAnterior: 0,
              stockResultante: cantidad,
              motivo: 'Carga inicial de inventario',
              referencia: `producto:${producto.id}`,
            });
          }
        }
      } else {
        const skuSolicitado = String(vData.sku || '').trim() || `${slugBase}-${index + 1}`;
        const sku = await uniqueSku(skuSolicitado);

        const nuevaVariante = await Variante.create({
          productoId: producto.id,
          sku,
          nombre: nombreVar,
          atributos,
          precioVenta: precioV,
          precioCompra: num(cambios.precioCompra ?? producto.precioCompra) ?? 0,
          imagenes: cambios.imagenes || producto.imagenes || [],
          activo: true,
        });

        await Inventario.create({
          varianteId: nuevaVariante.id,
          cantidad,
          ubicacion: vData.ubicacion || null,
          umbralBajo: 5,
        });

        if (cantidad > 0) {
          await Kardex.create({
            varianteId: nuevaVariante.id,
            tipo: 'ENTRADA',
            cantidad,
            stockAnterior: 0,
            stockResultante: cantidad,
            motivo: 'Variante creada en edición de producto',
            referencia: `producto:${producto.id}`,
          });
        }
        idsProcesados.add(nuevaVariante.id);
      }
    }

    for (const varExistente of existentes) {
      if (!idsProcesados.has(varExistente.id)) {
        await varExistente.update({ activo: false });
      }
    }
  }

  return getProducto(producto.id);
}

async function desactivarProducto(id) {
  const producto = await Producto.findByPk(id);
  if (!producto) throw new AppError('Producto no encontrado', 404);
  await producto.update({ activo: false });
  return { id: producto.id, activo: false };
}

async function listCategorias() {
  const categorias = await Categoria.findAll({ order: [['orden', 'ASC'], ['nombre', 'ASC']] });
  return categorias.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    slug: c.slug,
    descripcion: c.descripcion,
    parentId: c.parentId,
    atributos: c.atributos || [],
  }));
}

async function getCategoria(slugOrId) {
  const id = num(slugOrId);
  const where =
    id !== null
      ? { [Op.or]: [{ id }, { slug: String(slugOrId) }] }
      : { slug: String(slugOrId) };
  const categoria = await Categoria.findOne({ where });
  if (!categoria) throw new AppError('Categoría no encontrada', 404);
  return categoria;
}

async function crearCategoria(payload) {
  const { nombre, descripcion, parentId = null, atributos = [], orden = 0 } = payload || {};
  if (!nombre) throw new AppError('El nombre de la categoría es obligatorio', 400);
  const slug = slugify(nombre);
  const existing = await Categoria.findOne({ where: { slug } });
  if (existing) throw new AppError('La categoría ya existe', 409);
  const categoria = await Categoria.create({
    nombre,
    slug,
    descripcion,
    parentId,
    atributos,
    orden,
  });
  return categoria;
}

module.exports = {
  listProductos,
  getProducto,
  comparar,
  crearProducto,
  actualizarProducto,
  desactivarProducto,
  listCategorias,
  getCategoria,
  crearCategoria,
  serializeProducto,
  totalStock,
};
