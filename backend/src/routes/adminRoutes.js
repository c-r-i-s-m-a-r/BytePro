const { Router } = require('express');
const adminController = require('../controllers/adminController');
const empresaController = require('../controllers/empresaController');
const { authenticate } = require('../middlewares/auth');
const { requireStaff, requireActiveFunction, requireDispatchOperator } = require('../middlewares/rbac');

const router = Router();

// REQ-OPR-04: cambio de estado/evidencias con mensaje específico de función activa.
router.patch('/pedidos/:ventaId/estado', authenticate, requireDispatchOperator, adminController.actualizarEstadoPedido);
router.put('/pedidos/:ventaId/estado', authenticate, requireDispatchOperator, adminController.actualizarEstadoPedido);
router.post('/pedidos/:ventaId/estado', authenticate, requireDispatchOperator, adminController.actualizarEstadoPedido);
router.patch('/despachos/:id/estado', authenticate, requireDispatchOperator, adminController.actualizarEstadoPedido);
router.put('/despachos/:id/estado', authenticate, requireDispatchOperator, adminController.actualizarEstadoPedido);
router.post('/despachos/:id/estado', authenticate, requireDispatchOperator, adminController.actualizarEstadoPedido);

router.use(authenticate, requireStaff);

router.get('/resumen', adminController.resumen);
router.get('/analitica', adminController.analitica);
router.get('/metricas', adminController.resumen);
router.get('/dashboard', adminController.resumen);
router.get('/inventario', adminController.inventario);
router.get('/alertas-stock', adminController.alertasStock);
router.get('/pedidos', adminController.pedidos);
router.get('/ventas', adminController.pedidos);
// REQ-PAG-QR-03: solo ventas (vendedor en la app) o admin verifican comprobantes.
router.patch(
  '/pedidos/:ventaId/verificar-comprobante',
  requireActiveFunction('ventas', 'vendedor', 'admin'),
  adminController.verificarComprobantePedido
);
router.get('/usuarios', requireActiveFunction('admin'), adminController.usuarios);
router.post('/usuarios', requireActiveFunction('admin'), adminController.crearUsuario);
router.put('/usuarios/:id', requireActiveFunction('admin'), adminController.actualizarUsuario);
router.delete('/usuarios/:id', requireActiveFunction('admin'), adminController.eliminarUsuario);
router.get('/transacciones', adminController.transacciones);
router.get('/auditoria', adminController.auditoria);

// Comunicados internos: lectura para todo el personal, gestión exclusiva de admin
router.get('/comunicados', empresaController.listarComunicados);
router.post('/comunicados', requireActiveFunction('admin'), empresaController.crearComunicado);
router.put('/comunicados/:id', requireActiveFunction('admin'), empresaController.actualizarComunicado);
router.delete('/comunicados/:id', requireActiveFunction('admin'), empresaController.eliminarComunicado);

// Ajustes de empresa: exclusivo rol admin (REQ-AJU-01)
router.get('/ajustes', requireActiveFunction('admin'), empresaController.obtenerAjustes);
router.put('/ajustes', requireActiveFunction('admin'), empresaController.actualizarAjustes);

router.get('/proveedores', requireActiveFunction('admin'), empresaController.listarProveedores);
router.post('/proveedores', requireActiveFunction('admin'), empresaController.crearProveedor);
router.put('/proveedores/:id', requireActiveFunction('admin'), empresaController.actualizarProveedor);
router.delete('/proveedores/:id', requireActiveFunction('admin'), empresaController.eliminarProveedor);

router.get('/sucursales', requireActiveFunction('admin'), empresaController.listarSucursales);
router.post('/sucursales', requireActiveFunction('admin'), empresaController.crearSucursal);
router.put('/sucursales/:id', requireActiveFunction('admin'), empresaController.actualizarSucursal);
router.delete('/sucursales/:id', requireActiveFunction('admin'), empresaController.eliminarSucursal);

module.exports = router;
