require('dotenv').config();
const {
  sequelize,
  Categoria,
  Producto,
  Variante,
  Inventario,
  Usuario,
  Cliente,
  Empleado,
  Venta,
  VentaItem,
  Resena,
  Kardex,
  Despacho,
  Direccion,
} = require('../models');
const { hashPassword } = require('../utils/hash');
const { slugify } = require('../utils/sanitize');

const CATEGORIAS = [
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
];

const PRODUCTOS = [
  {
    cat: 'procesadores',
    nombre: 'AMD Ryzen 7 7800X3D',
    marca: 'AMD',
    modelo: '7800X3D',
    precioCompra: 380,
    precioVenta: 449.99,
    garantiaMeses: 36,
    specs: { socket: 'AM5', nucleos: 8, hilos: 16, frecuencia: '4.2 GHz', tdp: '120W' },
    variantes: [{ nombre: 'Estándar', atributos: {}, cantidad: 12 }],
  },
  {
    cat: 'procesadores',
    nombre: 'Intel Core i5-14600K',
    marca: 'Intel',
    modelo: 'i5-14600K',
    precioCompra: 240,
    precioVenta: 299.99,
    garantiaMeses: 36,
    specs: { socket: 'LGA1700', nucleos: 14, hilos: 20, frecuencia: '3.5 GHz', tdp: '125W' },
    variantes: [{ nombre: 'Estándar', atributos: {}, cantidad: 8 }],
  },
  {
    cat: 'procesadores',
    nombre: 'AMD Ryzen 5 7600',
    marca: 'AMD',
    modelo: '7600',
    precioCompra: 180,
    precioVenta: 229.99,
    garantiaMeses: 36,
    specs: { socket: 'AM5', nucleos: 6, hilos: 12, frecuencia: '3.8 GHz', tdp: '65W' },
    variantes: [{ nombre: 'Estándar', atributos: {}, cantidad: 15 }],
  },
  {
    cat: 'procesadores',
    nombre: 'Intel Core i9-14900K',
    marca: 'Intel',
    modelo: 'i9-14900K',
    precioCompra: 510,
    precioVenta: 589.99,
    garantiaMeses: 36,
    specs: { socket: 'LGA1700', nucleos: 24, hilos: 32, frecuencia: '3.2 GHz', tdp: '253W' },
    variantes: [{ nombre: 'Estándar', atributos: {}, cantidad: 4 }],
  },
  {
    cat: 'tarjetas-graficas',
    nombre: 'NVIDIA GeForce RTX 4070 Super',
    marca: 'NVIDIA',
    modelo: 'RTX 4070 Super',
    precioCompra: 520,
    precioVenta: 599.99,
    garantiaMeses: 24,
    specs: { vram: '12 GB', tipoMemoria: 'GDDR6X', conectores: 'HDMI 2.1, 3x DisplayPort 1.4a', tdp: '220W' },
    variantes: [{ nombre: 'Estándar', atributos: {}, cantidad: 6 }],
  },
  {
    cat: 'tarjetas-graficas',
    nombre: 'AMD Radeon RX 7800 XT',
    marca: 'AMD',
    modelo: 'RX 7800 XT',
    precioCompra: 430,
    precioVenta: 499.99,
    garantiaMeses: 24,
    specs: { vram: '16 GB', tipoMemoria: 'GDDR6', conectores: 'HDMI 2.1, 2x DisplayPort 2.1', tdp: '263W' },
    variantes: [{ nombre: 'Estándar', atributos: {}, cantidad: 5 }],
  },
  {
    cat: 'tarjetas-graficas',
    nombre: 'NVIDIA GeForce RTX 4060 Ti',
    marca: 'NVIDIA',
    modelo: 'RTX 4060 Ti',
    precioCompra: 330,
    precioVenta: 399.99,
    garantiaMeses: 24,
    specs: { vram: '8 GB', tipoMemoria: 'GDDR6', conectores: 'HDMI 2.1, 3x DisplayPort 1.4a', tdp: '160W' },
    variantes: [
      { nombre: '8 GB', atributos: { vram: '8 GB' }, precioVenta: 399.99, precioCompra: 330, cantidad: 7 },
      { nombre: '16 GB', atributos: { vram: '16 GB' }, precioVenta: 449.99, precioCompra: 370, cantidad: 3 },
    ],
  },
  {
    cat: 'tarjetas-graficas',
    nombre: 'NVIDIA GeForce RTX 4090',
    marca: 'NVIDIA',
    modelo: 'RTX 4090',
    precioCompra: 1400,
    precioVenta: 1599.99,
    garantiaMeses: 24,
    specs: { vram: '24 GB', tipoMemoria: 'GDDR6X', conectores: 'HDMI 2.1, 3x DisplayPort 1.4a', tdp: '450W' },
    variantes: [{ nombre: 'Estándar', atributos: {}, cantidad: 2 }],
  },
  {
    cat: 'placas-base',
    nombre: 'ASUS ROG Strix X670E-E Gaming',
    marca: 'ASUS',
    modelo: 'ROG Strix X670E-E',
    precioCompra: 300,
    precioVenta: 349.99,
    garantiaMeses: 36,
    specs: { socket: 'AM5', chipset: 'X670E', factorForma: 'ATX', memoria: 'DDR5' },
    variantes: [{ nombre: 'Estándar', atributos: {}, cantidad: 6 }],
  },
  {
    cat: 'placas-base',
    nombre: 'MSI MAG B650 Tomahawk WiFi',
    marca: 'MSI',
    modelo: 'MAG B650 Tomahawk',
    precioCompra: 180,
    precioVenta: 219.99,
    garantiaMeses: 36,
    specs: { socket: 'AM5', chipset: 'B650', factorForma: 'ATX', memoria: 'DDR5' },
    variantes: [{ nombre: 'Estándar', atributos: {}, cantidad: 9 }],
  },
  {
    cat: 'placas-base',
    nombre: 'Gigabyte Z790 AORUS Elite AX',
    marca: 'Gigabyte',
    modelo: 'Z790 AORUS Elite',
    precioCompra: 210,
    precioVenta: 259.99,
    garantiaMeses: 36,
    specs: { socket: 'LGA1700', chipset: 'Z790', factorForma: 'ATX', memoria: 'DDR5' },
    variantes: [{ nombre: 'Estándar', atributos: {}, cantidad: 7 }],
  },
  {
    cat: 'memoria-ram',
    nombre: 'Corsair Vengeance RGB DDR5',
    marca: 'Corsair',
    modelo: 'Vengeance RGB DDR5',
    precioCompra: 60,
    precioVenta: 79.99,
    garantiaMeses: 60,
    specs: { capacidad: '16 GB', tipo: 'DDR5', velocidad: '6000 MHz', latencia: 'CL30' },
    variantes: [
      { nombre: '16 GB', atributos: { capacidad: '16 GB' }, precioVenta: 79.99, precioCompra: 60, cantidad: 10 },
      { nombre: '32 GB', atributos: { capacidad: '32 GB' }, precioVenta: 119.99, precioCompra: 95, cantidad: 12 },
      { nombre: '64 GB', atributos: { capacidad: '64 GB' }, precioVenta: 219.99, precioCompra: 175, cantidad: 4 },
    ],
  },
  {
    cat: 'memoria-ram',
    nombre: 'Kingston Fury Beast DDR4',
    marca: 'Kingston',
    modelo: 'Fury Beast DDR4',
    precioCompra: 38,
    precioVenta: 49.99,
    garantiaMeses: 60,
    specs: { capacidad: '16 GB', tipo: 'DDR4', velocidad: '3200 MHz', latencia: 'CL16' },
    variantes: [{ nombre: 'Estándar', atributos: { capacidad: '16 GB' }, cantidad: 20 }],
  },
  {
    cat: 'almacenamiento',
    nombre: 'Samsung 990 Pro NVMe',
    marca: 'Samsung',
    modelo: '990 Pro',
    precioCompra: 90,
    precioVenta: 119.99,
    garantiaMeses: 60,
    specs: { capacidad: '1 TB', tipo: 'SSD NVMe', interfaz: 'PCIe 4.0', velocidad: '7450 MB/s' },
    variantes: [
      { nombre: '1 TB', atributos: { capacidad: '1 TB' }, precioVenta: 119.99, precioCompra: 90, cantidad: 10 },
      { nombre: '2 TB', atributos: { capacidad: '2 TB' }, precioVenta: 169.99, precioCompra: 130, cantidad: 8 },
      { nombre: '4 TB', atributos: { capacidad: '4 TB' }, precioVenta: 299.99, precioCompra: 240, cantidad: 0 },
    ],
  },
  {
    cat: 'almacenamiento',
    nombre: 'Crucial P3 Plus NVMe',
    marca: 'Crucial',
    modelo: 'P3 Plus',
    precioCompra: 50,
    precioVenta: 69.99,
    garantiaMeses: 60,
    specs: { capacidad: '1 TB', tipo: 'SSD NVMe', interfaz: 'PCIe 4.0', velocidad: '5000 MB/s' },
    variantes: [{ nombre: 'Estándar', atributos: { capacidad: '1 TB' }, cantidad: 14 }],
  },
  {
    cat: 'almacenamiento',
    nombre: 'Seagate Barracuda HDD',
    marca: 'Seagate',
    modelo: 'Barracuda',
    precioCompra: 65,
    precioVenta: 89.99,
    garantiaMeses: 24,
    specs: { capacidad: '4 TB', tipo: 'HDD', interfaz: 'SATA III', velocidad: '5400 RPM' },
    variantes: [{ nombre: 'Estándar', atributos: { capacidad: '4 TB' }, cantidad: 10 }],
  },
  {
    cat: 'fuentes',
    nombre: 'Corsair RM850x',
    marca: 'Corsair',
    modelo: 'RM850x',
    precioCompra: 100,
    precioVenta: 129.99,
    garantiaMeses: 120,
    specs: { potencia: '850W', certificacion: '80+ Gold', modular: 'Totalmente modular' },
    variantes: [{ nombre: 'Estándar', atributos: {}, cantidad: 8 }],
  },
  {
    cat: 'fuentes',
    nombre: 'EVGA 600 BR',
    marca: 'EVGA',
    modelo: '600 BR',
    precioCompra: 40,
    precioVenta: 54.99,
    garantiaMeses: 36,
    specs: { potencia: '600W', certificacion: '80+ Bronze', modular: 'No modular' },
    variantes: [{ nombre: 'Estándar', atributos: {}, cantidad: 12 }],
  },
  {
    cat: 'gabinetes',
    nombre: 'NZXT H7 Flow',
    marca: 'NZXT',
    modelo: 'H7 Flow',
    precioCompra: 85,
    precioVenta: 109.99,
    garantiaMeses: 24,
    specs: { factorForma: 'ATX Mid Tower', color: 'Negro' },
    variantes: [{ nombre: 'Negro', atributos: { color: 'Negro' }, cantidad: 7 }],
  },
  {
    cat: 'gabinetes',
    nombre: 'Lian Li O11 Dynamic EVO',
    marca: 'Lian Li',
    modelo: 'O11 Dynamic EVO',
    precioCompra: 110,
    precioVenta: 139.99,
    garantiaMeses: 24,
    specs: { factorForma: 'ATX Mid Tower', color: 'Blanco' },
    variantes: [{ nombre: 'Blanco', atributos: { color: 'Blanco' }, cantidad: 5 }],
  },
  {
    cat: 'refrigeracion',
    nombre: 'Noctua NH-D15',
    marca: 'Noctua',
    modelo: 'NH-D15',
    precioCompra: 85,
    precioVenta: 109.99,
    garantiaMeses: 72,
    specs: { tipo: 'Aire', tdp: '250W', tamaño: '165 mm' },
    variantes: [{ nombre: 'Estándar', atributos: {}, cantidad: 9 }],
  },
  {
    cat: 'refrigeracion',
    nombre: 'NZXT Kraken 240',
    marca: 'NZXT',
    modelo: 'Kraken 240',
    precioCompra: 110,
    precioVenta: 139.99,
    garantiaMeses: 36,
    specs: { tipo: 'Líquida AIO', tdp: '280W', tamaño: '240 mm' },
    variantes: [{ nombre: 'Estándar', atributos: {}, cantidad: 6 }],
  },
];

async function crearUsuario({ username, email, password, nombre, rol, extra }) {
  const passwordHash = await hashPassword(password);
  const usuario = await Usuario.create({
    username,
    email,
    passwordHash,
    nombre,
    rol,
    telefono: extra?.telefono || null,
  });
  if (rol === 'cliente') {
    await Cliente.create({ usuarioId: usuario.id, direccion: extra?.direccion || null });
  } else {
    await Empleado.create({
      usuarioId: usuario.id,
      ci: extra?.ci || null,
      puesto: extra?.puesto || null,
    });
  }
  return usuario;
}

async function main() {
  await sequelize.authenticate();
  await sequelize.sync({ force: true });
  // eslint-disable-next-line no-console
  console.log('[seed] base de datos recreada');

  const categorias = {};
  for (const data of CATEGORIAS) {
    // eslint-disable-next-line no-await-in-loop
    const categoria = await Categoria.create(data);
    categorias[data.slug] = categoria;
  }
  // eslint-disable-next-line no-console
  console.log(`[seed] ${Object.keys(categorias).length} categorías`);

  let correlativo = 1;
  const variantesPorProducto = {};

  for (const data of PRODUCTOS) {
    const categoria = categorias[data.cat];
    const slug = slugify(data.nombre);
    // eslint-disable-next-line no-await-in-loop
    const producto = await Producto.create({
      nombre: data.nombre,
      marca: data.marca,
      modelo: data.modelo,
      slug,
      descripcion: `${data.nombre} — hardware de alto rendimiento de ${data.marca}.`,
      categoriaId: categoria.id,
      precioCompra: data.precioCompra,
      precioVenta: data.precioVenta,
      garantiaMeses: data.garantiaMeses,
      especificaciones: data.specs,
      imagenes: [],
      imagenPrincipal: null,
      activo: true,
    });

    const variantes = [];
    for (const v of data.variantes) {
      const sku = `${slug.toUpperCase().replace(/-/g, '').slice(0, 14)}-${String(
        correlativo
      ).padStart(3, '0')}`;
      const ean = `750${String(correlativo).padStart(10, '0')}`;
      correlativo += 1;
      // eslint-disable-next-line no-await-in-loop
      const variante = await Variante.create({
        productoId: producto.id,
        sku,
        ean,
        nombre: v.nombre || 'Estándar',
        atributos: v.atributos || {},
        precioVenta: v.precioVenta ?? data.precioVenta,
        precioCompra: v.precioCompra ?? data.precioCompra,
        imagenes: [],
        activo: true,
      });
      const cantidadInicial = Number(v.cantidad) || 0;
      // eslint-disable-next-line no-await-in-loop
      await Inventario.create({
        varianteId: variante.id,
        cantidad: cantidadInicial,
        ubicacion: `Almacén A-${String(correlativo).padStart(2, '0')}`,
        umbralBajo: 5,
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
          referencia: 'seed',
        });
      }
      variantes.push(variante);
    }
    variantesPorProducto[slug] = { producto, variantes };
  }
  // eslint-disable-next-line no-console
  console.log(`[seed] ${PRODUCTOS.length} productos con variantes e inventario`);

  const admin = await crearUsuario({
    username: 'admin',
    email: 'admin@bytepro.com',
    password: 'Admin1234',
    nombre: 'Administrador BytePro',
    rol: 'admin',
    extra: { ci: 'V-10000001', puesto: 'Gerente de operaciones' },
  });
  const vendedor = await crearUsuario({
    username: 'vendedor',
    email: 'vendedor@bytepro.com',
    password: 'Vendedor1234',
    nombre: 'Vendedor BytePro',
    rol: 'vendedor',
    extra: { ci: 'V-10000002', puesto: 'Ventas' },
  });
  const cliente = await crearUsuario({
    username: 'cliente',
    email: 'cliente@bytepro.com',
    password: 'Cliente1234',
    nombre: 'Cliente Demo',
    rol: 'cliente',
    extra: { direccion: 'Av. Principal 123' },
  });
  const cliente2 = await crearUsuario({
    username: 'cliente2',
    email: 'cliente2@bytepro.com',
    password: 'Cliente1234',
    nombre: 'María Pérez',
    rol: 'cliente',
    extra: { direccion: 'Calle Secundaria 456' },
  });

  // Compra verificada para habilitar reseñas (SPEC-003 REQ-CAT-12/13)
  const cpu = variantesPorProducto['amd-ryzen-7-7800x3d'];
  const gpu = variantesPorProducto['nvidia-geforce-rtx-4070-super'];

  const venta1 = await Venta.create({ usuarioId: cliente.id, total: 449.99, estado: 'entregada' });
  await VentaItem.create({
    ventaId: venta1.id,
    varianteId: cpu.variantes[0].id,
    cantidad: 1,
    precioUnitario: 449.99,
  });

  const venta2 = await Venta.create({ usuarioId: cliente2.id, total: 599.99, estado: 'pagada' });
  await VentaItem.create({
    ventaId: venta2.id,
    varianteId: gpu.variantes[0].id,
    cantidad: 1,
    precioUnitario: 599.99,
  });

  await Direccion.create({
    usuarioId: cliente.id,
    etiqueta: 'Casa',
    nombreDestinatario: cliente.nombre,
    calle: 'Av. Principal 123',
    ciudad: 'La Paz',
    telefono: '70011223',
    referencias: 'Frente a la plaza principal',
    predeterminada: true,
  });

  await Direccion.create({
    usuarioId: cliente2.id,
    etiqueta: 'Oficina',
    nombreDestinatario: cliente2.nombre,
    calle: 'Calle Secundaria 456',
    ciudad: 'Cochabamba',
    telefono: '70044556',
    referencias: 'Edificio empresarial piso 3',
    predeterminada: true,
  });

  const hoy = new Date();
  const ymd = `${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, '0')}${String(
    hoy.getDate()
  ).padStart(2, '0')}`;

  await Despacho.create({
    ventaId: venta1.id,
    codigoSeguimiento: `TRK-${ymd}-0001`,
    estado: 'ENTREGADO',
    nombreDestinatario: cliente.nombre,
    direccion: 'Av. Principal 123',
    ciudad: 'La Paz',
    telefono: '70011223',
    notas: 'Frente a la plaza principal',
    ubicacionActual: 'Domicilio del destinatario',
    fechaEstimada: hoy,
    historial: [
      {
        estado: 'PEDIDO_CONFIRMADO',
        timestamp: hoy.toISOString(),
        ubicacion: 'Centro de Recepción BytePro',
        nota: 'Pago validado y orden recibida.',
      },
      {
        estado: 'EN_PREPARACION',
        timestamp: hoy.toISOString(),
        ubicacion: 'Almacén de Hardware BytePro',
        nota: 'Empaquetado en almacén de hardware.',
      },
      {
        estado: 'EN_CAMINO',
        timestamp: hoy.toISOString(),
        ubicacion: 'En ruta de distribución nacional',
        nota: 'Entregado al transportista.',
      },
      {
        estado: 'ENTREGADO',
        timestamp: hoy.toISOString(),
        ubicacion: 'Domicilio del destinatario',
        nota: 'Entregado satisfactoriamente al destinatario.',
      },
    ],
    nota: 'Entregado satisfactoriamente.',
  });

  await Despacho.create({
    ventaId: venta2.id,
    codigoSeguimiento: `TRK-${ymd}-0002`,
    estado: 'PEDIDO_CONFIRMADO',
    nombreDestinatario: cliente2.nombre,
    direccion: 'Calle Secundaria 456',
    ciudad: 'Cochabamba',
    telefono: '70044556',
    notas: 'Edificio empresarial piso 3',
    ubicacionActual: 'Centro de Recepción BytePro',
    fechaEstimada: new Date(hoy.getTime() + 3 * 24 * 60 * 60 * 1000),
    historial: [
      {
        estado: 'PEDIDO_CONFIRMADO',
        timestamp: hoy.toISOString(),
        ubicacion: 'Centro de Recepción BytePro',
        nota: 'Pago validado y orden recibida.',
      },
    ],
    nota: 'Pago confirmado. Pendiente de preparación.',
  });

  await Resena.create({
    productoId: cpu.producto.id,
    usuarioId: cliente.id,
    calificacion: 5,
    comentario: 'Excelente rendimiento en juegos, temperaturas controladas y muy estable.',
    compraVerificada: true,
  });
  await Resena.create({
    productoId: cpu.producto.id,
    usuarioId: cliente2.id,
    calificacion: 4,
    comentario: 'Muy buen procesador, aunque el precio es elevado.',
    compraVerificada: false,
  });
  await Resena.create({
    productoId: gpu.producto.id,
    usuarioId: cliente2.id,
    calificacion: 5,
    comentario: 'Gran tarjeta gráfica para 1440p, silenciosa y eficiente.',
    compraVerificada: true,
  });

  for (const { producto } of Object.values(variantesPorProducto)) {
    // eslint-disable-next-line no-await-in-loop
    const resenas = await Resena.findAll({ where: { productoId: producto.id } });
    if (resenas.length) {
      const promedio =
        resenas.reduce((sum, r) => sum + r.calificacion, 0) / resenas.length;
      // eslint-disable-next-line no-await-in-loop
      await producto.update({
        puntajePromedio: Number(promedio.toFixed(2)),
        totalResenas: resenas.length,
      });
    }
  }

  // eslint-disable-next-line no-console
  console.log('[seed] usuarios demo:');
  // eslint-disable-next-line no-console
  console.log('  admin@bytepro.com / Admin1234 (admin)');
  // eslint-disable-next-line no-console
  console.log('  vendedor@bytepro.com / Vendedor1234 (vendedor)');
  // eslint-disable-next-line no-console
  console.log('  cliente@bytepro.com / Cliente1234 (cliente)');
  // eslint-disable-next-line no-console
  console.log('  cliente2@bytepro.com / Cliente1234 (cliente)');
  // eslint-disable-next-line no-console
  console.log('[seed] listo');
  void admin;
  void vendedor;

  await sequelize.close();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[seed] error', err);
  process.exitCode = 1;
});
