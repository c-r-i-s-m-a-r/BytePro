const { Router } = require('express');
const carritoController = require('../controllers/carritoController');
const { optionalAuth } = require('../middlewares/auth');

const router = Router();

router.use(optionalAuth);

router.get('/', carritoController.get);
router.post('/items', carritoController.agregar);
router.patch('/items/:itemId', carritoController.actualizar);
router.delete('/items/:itemId', carritoController.eliminar);
router.delete('/', carritoController.vaciar);

module.exports = router;
