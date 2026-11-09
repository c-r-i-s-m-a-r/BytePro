const { Router } = require('express');
const cobroController = require('../controllers/cobroController');
const clienteController = require('../controllers/clienteController');
const { authenticate } = require('../middlewares/auth');

const router = Router();

router.get('/metodos', cobroController.metodos);
router.get('/sucursales', cobroController.sucursales);
router.post('/checkout', authenticate, cobroController.checkout);
router.patch('/checkout/entrega', authenticate, cobroController.actualizarEntrega);
router.post('/pagar', authenticate, cobroController.pagar);
router.get('/ventas/:ventaId', authenticate, cobroController.venta);
router.get('/ventas/:ventaId/recibo', authenticate, cobroController.recibo);
router.post('/ventas/:ventaId/cancelar', authenticate, clienteController.cancelarPedido);
router.patch('/ventas/:ventaId/cancelar', authenticate, clienteController.cancelarPedido);
router.get('/mis-pedidos', authenticate, clienteController.listarPedidos);

module.exports = router;
