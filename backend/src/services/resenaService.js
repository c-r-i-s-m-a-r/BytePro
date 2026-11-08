const { Op } = require('sequelize');
const { Resena, Producto, Venta, VentaItem, Variante, Usuario } = require('../models');
const AppError = require('../utils/AppError');

const LONGITUD_MAXIMA = 1000;
const LONGITUD_MINIMA = 5;
const PALABRAS_NO_PERMITIDAS = [
  'idiota',
  'estupido',
  'estúpido',
  'imbecil',
  'imbécil',
  'mierda',
  'pendejo',
  'puta',
  'basura',
];

function contieneLenguajeNoPermitido(texto) {
  const normalizado = texto.toLowerCase();
  return PALABRAS_NO_PERMITIDAS.some((palabra) => normalizado.includes(palabra));
}

async function recomputarPuntaje(productoId) {
  const resenas = await Resena.findAll({ where: { productoId } });
  const total = resenas.length;
  const promedio = total
    ? resenas.reduce((sum, r) => sum + r.calificacion, 0) / total
    : 0;
  await Producto.update(
    { puntajePromedio: Number(promedio.toFixed(2)), totalResenas: total },
    { where: { id: productoId } }
  );
  return { puntajePromedio: Number(promedio.toFixed(2)), totalResenas: total };
}

async function listarResenas(productoId) {
  const producto = await Producto.findByPk(productoId);
  if (!producto) throw new AppError('Producto no encontrado', 404);

  const resenas = await Resena.findAll({
    where: { productoId },
    include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] }],
    order: [['createdAt', 'DESC']],
  });

  return {
    puntajePromedio: Number(producto.puntajePromedio || 0),
    totalResenas: Number(producto.totalResenas || 0),
    resenas: resenas.map((r) => ({
      id: r.id,
      calificacion: r.calificacion,
      comentario: r.comentario,
      compraVerificada: r.compraVerificada,
      autor: r.usuario ? r.usuario.nombre : 'Cliente',
      fecha: r.createdAt,
    })),
  };
}

async function tieneCompraVerificada(usuarioId, productoId) {
  const venta = await VentaItem.findOne({
    include: [
      {
        model: Venta,
        as: 'venta',
        required: true,
        where: {
          usuarioId,
          estado: { [Op.in]: ['pagada', 'enviada', 'entregada'] },
        },
      },
      {
        model: Variante,
        as: 'variante',
        required: true,
        where: { productoId },
      },
    ],
  });
  return Boolean(venta);
}

async function crearResena({ productoId, usuario, calificacion, comentario }) {
  const producto = await Producto.findByPk(productoId);
  if (!producto || !producto.activo) {
    throw new AppError('Producto no encontrado', 404);
  }

  const nota = parseInt(calificacion, 10);
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
    throw new AppError('La calificación debe estar entre 1 y 5 estrellas', 400);
  }

  const texto = String(comentario || '').trim();
  if (texto.length < LONGITUD_MINIMA) {
    throw new AppError('La reseña es demasiado corta', 400);
  }
  if (texto.length > LONGITUD_MAXIMA) {
    throw new AppError(
      `La reseña supera la longitud máxima permitida (${LONGITUD_MAXIMA} caracteres)`,
      400
    );
  }
  if (contieneLenguajeNoPermitido(texto)) {
    throw new AppError('La reseña infringe las directrices comunitarias', 400);
  }

  const verificado = await tieneCompraVerificada(usuario.id, producto.id);
  if (!verificado) {
    throw new AppError('Solo puedes reseñar productos que hayas adquirido', 403);
  }

  const existente = await Resena.findOne({
    where: { productoId: producto.id, usuarioId: usuario.id },
  });
  if (existente) {
    throw new AppError('Ya has publicado una reseña para este producto', 409);
  }

  const resena = await Resena.create({
    productoId: producto.id,
    usuarioId: usuario.id,
    calificacion: nota,
    comentario: texto,
    compraVerificada: true,
  });

  const resumen = await recomputarPuntaje(producto.id);

  return {
    id: resena.id,
    calificacion: resena.calificacion,
    comentario: resena.comentario,
    compraVerificada: resena.compraVerificada,
    autor: usuario.nombre,
    fecha: resena.createdAt,
    ...resumen,
  };
}

module.exports = {
  listarResenas,
  crearResena,
  tieneCompraVerificada,
  recomputarPuntaje,
};
