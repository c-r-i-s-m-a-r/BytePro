const { Op } = require('sequelize');
const {
  Usuario,
  Empleado,
  Categoria,
  ConfiguracionEmpresa,
} = require('./models');
const { hashPassword } = require('./utils/hash');

const CATEGORIAS_BASE = [
  {
    nombre: 'Procesadores',
    slug: 'procesadores',
    descripcion: 'CPUs para escritorio',
    orden: 1,
    atributos: [
      { clave: 'socket', etiqueta: 'Socket', tipo: 'select', opciones: ['AM5', 'AM4', 'LGA1700', 'LGA1851'], requerido: true },
      { clave: 'nucleos', etiqueta: 'Núcleos', tipo: 'number', requerido: true },
      { clave: 'hilos', etiqueta: 'Hilos', tipo: 'number', requerido: true },
      { clave: 'frecuencia', etiqueta: 'Frecuencia', tipo: 'text', requerido: false },
      { clave: 'tdp', etiqueta: 'TDP', tipo: 'text', requerido: false },
    ],
  },
  {
    nombre: 'Tarjetas Gráficas',
    slug: 'tarjetas-graficas',
    descripcion: 'GPUs dedicadas',
    orden: 2,
    atributos: [
      { clave: 'vram', etiqueta: 'VRAM', tipo: 'select', opciones: ['8 GB', '12 GB', '16 GB', '24 GB'], requerido: true },
      { clave: 'tipoMemoria', etiqueta: 'Tipo de memoria', tipo: 'select', opciones: ['GDDR6', 'GDDR6X'], requerido: true },
      { clave: 'conectores', etiqueta: 'Conectores', tipo: 'text', requerido: false },
      { clave: 'tdp', etiqueta: 'TDP', tipo: 'text', requerido: false },
    ],
  },
  {
    nombre: 'Placas Base',
    slug: 'placas-base',
    descripcion: 'Motherboards',
    orden: 3,
    atributos: [
      { clave: 'socket', etiqueta: 'Socket', tipo: 'select', opciones: ['AM5', 'AM4', 'LGA1700'], requerido: true },
      { clave: 'chipset', etiqueta: 'Chipset', tipo: 'text', requerido: true },
      { clave: 'factorForma', etiqueta: 'Factor de forma', tipo: 'select', opciones: ['ATX', 'Micro-ATX', 'Mini-ITX'], requerido: true },
      { clave: 'memoria', etiqueta: 'Memoria', tipo: 'select', opciones: ['DDR4', 'DDR5'], requerido: true },
    ],
  },
  {
    nombre: 'Memorias RAM',
    slug: 'memoria-ram',
    descripcion: 'Módulos de memoria',
    orden: 4,
    atributos: [
      { clave: 'capacidad', etiqueta: 'Capacidad', tipo: 'select', opciones: ['16 GB', '32 GB', '64 GB'], requerido: true },
      { clave: 'tipo', etiqueta: 'Tipo', tipo: 'select', opciones: ['DDR4', 'DDR5'], requerido: true },
      { clave: 'velocidad', etiqueta: 'Velocidad', tipo: 'text', requerido: false },
      { clave: 'latencia', etiqueta: 'Latencia', tipo: 'text', requerido: false },
    ],
  },
  {
    nombre: 'Almacenamiento',
    slug: 'almacenamiento',
    descripcion: 'SSD y HDD',
    orden: 5,
    atributos: [
      { clave: 'capacidad', etiqueta: 'Capacidad', tipo: 'select', opciones: ['1 TB', '2 TB', '4 TB'], requerido: true },
      { clave: 'tipo', etiqueta: 'Tipo', tipo: 'select', opciones: ['SSD NVMe', 'SSD SATA', 'HDD'], requerido: true },
      { clave: 'interfaz', etiqueta: 'Interfaz', tipo: 'text', requerido: false },
      { clave: 'velocidad', etiqueta: 'Velocidad', tipo: 'text', requerido: false },
    ],
  },
  {
    nombre: 'Fuentes de Poder',
    slug: 'fuentes',
    descripcion: 'PSUs',
    orden: 6,
    atributos: [
      { clave: 'potencia', etiqueta: 'Potencia', tipo: 'select', opciones: ['600W', '750W', '850W', '1000W'], requerido: true },
      { clave: 'certificacion', etiqueta: 'Certificación', tipo: 'select', opciones: ['80+ Bronze', '80+ Gold', '80+ Platinum'], requerido: true },
      { clave: 'modular', etiqueta: 'Modularidad', tipo: 'text', requerido: false },
    ],
  },
  {
    nombre: 'Gabinetes',
    slug: 'gabinetes',
    descripcion: 'Chasis',
    orden: 7,
    atributos: [
      { clave: 'factorForma', etiqueta: 'Factor de forma', tipo: 'select', opciones: ['ATX Mid Tower', 'ATX Full Tower', 'Micro-ATX'], requerido: true },
      { clave: 'color', etiqueta: 'Color', tipo: 'select', opciones: ['Negro', 'Blanco'], requerido: true },
    ],
  },
  {
    nombre: 'Refrigeración',
    slug: 'refrigeracion',
    descripcion: 'Disipadores y AIO',
    orden: 8,
    atributos: [
      { clave: 'tipo', etiqueta: 'Tipo', tipo: 'select', opciones: ['Aire', 'Líquida AIO'], requerido: true },
      { clave: 'tdp', etiqueta: 'TDP soportado', tipo: 'text', requerido: false },
      { clave: 'tamaño', etiqueta: 'Tamaño', tipo: 'text', requerido: false },
    ],
  },
  {
    nombre: 'Accesorios',
    slug: 'accesorios',
    descripcion: 'Periféricos, cables y accesorios para tu equipo',
    orden: 9,
    atributos: [
      {
        clave: 'tipo',
        etiqueta: 'Tipo',
        tipo: 'select',
        opciones: ['Teclado', 'Mouse', 'Audífonos', 'Cable', 'Adaptador', 'Otro'],
        requerido: false,
      },
      { clave: 'conexion', etiqueta: 'Conexión', tipo: 'text', requerido: false },
      { clave: 'color', etiqueta: 'Color', tipo: 'text', requerido: false },
    ],
  },
];

async function bootstrap() {
  try {
    // 1. Administrador Inicial si no existe ningún admin
    const adminExistente = await Usuario.findOne({
      where: {
        [Op.or]: [{ rol: 'admin' }, { email: 'admin@bytepro.com' }],
      },
    });

    if (!adminExistente) {
      const passwordHash = await hashPassword('Admin1234');
      const admin = await Usuario.create({
        username: 'admin',
        email: 'admin@bytepro.com',
        passwordHash,
        nombre: 'Administrador General',
        rol: 'admin',
        roles: JSON.stringify(['admin', 'vendedor', 'soporte', 'operaciones']),
        funcionActiva: 'admin',
        activo: true,
      });

      await Empleado.findOrCreate({
        where: { usuarioId: admin.id },
        defaults: {
          usuarioId: admin.id,
          puesto: 'Administrador General de Sistemas',
        },
      });

      // eslint-disable-next-line no-console
      console.log('[bootstrap] Administrador inicial creado (admin@bytepro.com)');
    }

    // 2. Categorías Base oficiales (9 categorías)
    for (const data of CATEGORIAS_BASE) {
      // eslint-disable-next-line no-await-in-loop
      await Categoria.findOrCreate({
        where: {
          [Op.or]: [{ slug: data.slug }, { nombre: data.nombre }],
        },
        defaults: data,
      });
    }

    // 3. Configuración de Empresa con valores por defecto
    await ConfiguracionEmpresa.findOrCreate({
      where: { id: 1 },
      defaults: {
        descuentoRetiroAlto: 7,
        descuentoRetiroBajo: 5,
        umbralDescuentoRetiro: 500,
        moneda: 'BOB',
      },
    });

    // eslint-disable-next-line no-console
    console.log('[bootstrap] Inicialización completada exitosamente.');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[bootstrap] Error durante la inicialización:', err);
  }
}

module.exports = bootstrap;
module.exports.bootstrap = bootstrap;
