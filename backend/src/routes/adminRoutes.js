const { Router } = require('express');
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middlewares/auth');
const { requireStaff, requireActiveFunction } = require('../middlewares/rbac');

const router = Router();

router.use(authenticate, requireStaff);

router.get('/resumen', adminController.resumen);
router.get('/metricas', adminController.resumen);
router.get('/dashboard', adminController.resumen);
router.get('/inventario', adminController.inventario);
router.get('/alertas-stock', adminController.alertasStock);
router.get('/pedidos', adminController.pedidos);
router.get('/ventas', adminController.pedidos);
router.patch('/pedidos/:ventaId/estado', requireActiveFunction('operaciones', 'admin'), adminController.actualizarEstadoPedido);
router.put('/pedidos/:ventaId/estado', requireActiveFunction('operaciones', 'admin'), adminController.actualizarEstadoPedido);
router.post('/pedidos/:ventaId/estado', requireActiveFunction('operaciones', 'admin'), adminController.actualizarEstadoPedido);
router.patch('/despachos/:id/estado', requireActiveFunction('operaciones', 'admin'), adminController.actualizarEstadoPedido);
router.put('/despachos/:id/estado', requireActiveFunction('operaciones', 'admin'), adminController.actualizarEstadoPedido);
router.post('/despachos/:id/estado', requireActiveFunction('operaciones', 'admin'), adminController.actualizarEstadoPedido);
router.get('/usuarios', requireActiveFunction('admin'), adminController.usuarios);
router.post('/usuarios', requireActiveFunction('admin'), adminController.crearUsuario);
router.put('/usuarios/:id', requireActiveFunction('admin'), adminController.actualizarUsuario);
router.delete('/usuarios/:id', requireActiveFunction('admin'), adminController.eliminarUsuario);
router.get('/transacciones', adminController.transacciones);
router.get('/auditoria', adminController.auditoria);

module.exports = router;
