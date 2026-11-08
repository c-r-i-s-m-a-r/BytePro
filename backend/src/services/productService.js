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
  if (!specs || Object.keys(specs).length === 0) {
    // eslint-disable-next-line no-console
    console.warn(`[catalogo] Producto ${producto.id} excluido: sin atributos técnicos`);
    return false;
  }
  const requeridos = (producto.categoria.atributos || []).filter((a) => a.requerido);
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
    precioVenta = 0,
    garantiaMeses = 12,
    especificaciones = {},
    imagenes = [],
    imagenPrincipal = null,
    variantes = [],
  } = payload || {};

  if (!nombre || !marca) {
    throw new AppError('Nombre y marca son obligatorios', 400);
  }
  const categoria = await Categoria.findByPk(categoriaId);
  if (!categoria) throw new AppError('Categoría no válida', 400);

  const slug = await uniqueSlug(nombre);

  const producto = await Producto.create({
    nombre,
    marca,
    modelo,
    slug,
    descripcion,
    categoriaId: categoria.id,
    precioCompra,
    precioVenta,
    garantiaMeses,
    especificaciones,
    imagenes,
    imagenPrincipal,
    activo: true,
  });

  const variantesData = variantes.length
    ? variantes
    : [
        {
          sku: `${slug.toUpperCase().slice(0, 20)}-BASE`,
          nombre: 'Estándar',
          atributos: {},
          precioVenta,
          precioCompra,
          imagenes,
          cantidad: 0,
        },
      ];

  for (const v of variantesData) {
    // eslint-disable-next-line no-await-in-loop
    const variante = await Variante.create({
      productoId: producto.id,
      sku: v.sku,
      ean: v.ean || null,
      nombre: v.nombre || null,
      atributos: v.atributos || {},
      precioVenta: v.precioVenta ?? precioVenta,
      precioCompra: v.precioCompra ?? precioCompra,
      imagenes: v.imagenes || imagenes,
      activo: true,
    });
    const cantidadInicial = Number(v.cantidad) || 0;
    // eslint-disable-next-line no-await-in-loop
    await Inventario.create({
      varianteId: variante.id,
      cantidad: cantidadInicial,
      ubicacion: v.ubicacion || null,
      umbralBajo: v.umbralBajo ?? 5,
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
    'especificaciones',
    'imagenes',
    'imagenPrincipal',
    'activo',
  ];
  const cambios = {};
  campos.forEach((campo) => {
    if (payload[campo] !== undefined) cambios[campo] = payload[campo];
  });

  if (cambios.categoriaId !== undefined) {
    const categoria = await Categoria.findByPk(cambios.categoriaId);
    if (!categoria) throw new AppError('Categoría no válida', 400);
  }

  await producto.update(cambios);
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
