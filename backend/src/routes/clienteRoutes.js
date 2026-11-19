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

// Perfil del cliente (SPEC-029)
router.get('/perfil', requireRole('cliente'), clienteController.obtenerPerfil);
router.put('/perfil', requireRole('cliente'), clienteController.actualizarPerfil);
router.put('/email', requireRole('cliente'), clienteController.cambiarEmail);
router.put('/password', requireRole('cliente'), clienteController.cambiarPassword);
router.delete('/cuenta', requireRole('cliente'), clienteController.eliminarCuenta);

// Tarjetas guardadas del cliente (SPEC-029)
router.get('/tarjetas', requireRole('cliente'), clienteController.listarTarjetas);
router.post('/tarjetas', requireRole('cliente'), clienteController.agregarTarjeta);
router.delete('/tarjetas/:id', requireRole('cliente'), clienteController.eliminarTarjeta);

// Reclamos del cliente (SPEC-029)
router.get('/reclamos', requireRole('cliente'), clienteController.listarReclamos);

module.exports = router;
