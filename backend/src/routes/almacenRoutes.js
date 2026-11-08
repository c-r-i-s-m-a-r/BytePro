const { Router } = require('express');
const almacenController = require('../controllers/almacenController');
const { authenticate } = require('../middlewares/auth');
const { requireStaff, requireActiveFunction } = require('../middlewares/rbac');

const router = Router();

router.use(authenticate, requireStaff);

router.get('/inventario', almacenController.inventario);
router.get('/kardex', almacenController.kardex);
router.post('/entradas', requireActiveFunction('operaciones', 'admin'), almacenController.entrada);
router.post('/salidas', requireActiveFunction('operaciones', 'admin'), almacenController.salida);
router.post('/ajustes', requireActiveFunction('operaciones', 'admin'), almacenController.ajuste);

module.exports = router;
