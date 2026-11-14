const { Router } = require('express');
const authRoutes = require('./authRoutes');
const productoRoutes = require('./productoRoutes');
const categoriaRoutes = require('./categoriaRoutes');
const carritoRoutes = require('./carritoRoutes');
const adminRoutes = require('./adminRoutes');
const cobrosRoutes = require('./cobrosRoutes');
const almacenRoutes = require('./almacenRoutes');
const distribucionRoutes = require('./distribucionRoutes');
const clienteRoutes = require('./clienteRoutes');
const soporteRoutes = require('./soporteRoutes');
const distribucionController = require('../controllers/distribucionController');
const clienteController = require('../controllers/clienteController');
const soporteController = require('../controllers/soporteController');
const realtimeHub = require('../services/realtimeHub');
const env = require('../config/env');
const { sequelize } = require('../models');
const { authenticate, optionalAuth } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'bytepro-api' });
});

// REQ-SUP-04: Configuración pública y canal SSE de tiempo real.
router.get('/config/public', (req, res) => {
  res.json({
    supabaseUrl: env.supabaseUrl,
    supabaseAnonKey: env.supabaseAnonKey,
    dialect: sequelize.getDialect(),
    realtimeEnabled: true,
  });
});

router.get('/realtime/stream', realtimeHub.subscribeSse);

router.use('/auth', authRoutes);
router.use('/productos', productoRoutes);
router.use('/categorias', categoriaRoutes);
router.use('/carrito', carritoRoutes);
router.use('/cobros', cobrosRoutes);
router.use('/almacen', almacenRoutes);
router.use('/distribucion', distribucionRoutes);
router.use('/clientes', clienteRoutes);
router.use('/soporte', soporteRoutes);
router.use('/admin', adminRoutes);

// Alias directos para reclamos / ayuda
router.post('/reclamos', optionalAuth, soporteController.crear);
router.post('/ayuda', optionalAuth, soporteController.crear);
router.get('/reclamos/:idOrCodigo', optionalAuth, soporteController.detalle);

// Alias directos para tracking y pedidos/direcciones de cliente
router.get('/tracking/:codigo', optionalAuth, distribucionController.tracking);
router.get('/pedidos', authenticate, requireRole('cliente'), clienteController.listarPedidos);
router.get('/pedidos/:ventaId', authenticate, clienteController.detallePedido);
router.post('/pedidos/:ventaId/cancelar', authenticate, clienteController.cancelarPedido);
router.patch('/pedidos/:ventaId/cancelar', authenticate, clienteController.cancelarPedido);
router.get('/direcciones', authenticate, clienteController.listarDirecciones);
router.post('/direcciones', authenticate, clienteController.crearDireccion);
router.put('/direcciones/:id', authenticate, clienteController.actualizarDireccion);
router.delete('/direcciones/:id', authenticate, clienteController.eliminarDireccion);

module.exports = router;
