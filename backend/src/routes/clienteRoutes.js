const { Router } = require('express');
const clienteController = require('../controllers/clienteController');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');

const router = Router();

router.use(authenticate);

// Historial y detalle de Mis Pedidos (REQ-CLI-01 a REQ-CLI-06)
router.get('/pedidos', requireRole('cliente'), clienteController.listarPedidos);
router.get('/pedidos/:ventaId', clienteController.detallePedido);
router.post('/pedidos/:ventaId/cancelar', clienteController.cancelarPedido);
router.patch('/pedidos/:ventaId/cancelar', clienteController.cancelarPedido);

// Libreta de direcciones guardadas (REQ-CLI-07 y REQ-CLI-08)
router.get('/direcciones', clienteController.listarDirecciones);
router.post('/direcciones', clienteController.crearDireccion);
router.put('/direcciones/:id', clienteController.actualizarDireccion);
router.patch('/direcciones/:id', clienteController.actualizarDireccion);
router.delete('/direcciones/:id', clienteController.eliminarDireccion);

module.exports = router;
