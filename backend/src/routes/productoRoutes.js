const { Router } = require('express');
const productoController = require('../controllers/productoController');
const resenaController = require('../controllers/resenaController');
const { authenticate, optionalAuth } = require('../middlewares/auth');
const { requireProductManager } = require('../middlewares/rbac');

const router = Router();

router.get('/', productoController.list);
router.get('/comparar', productoController.comparar);

router.get('/:idOrSlug/resenas', resenaController.list);
router.post('/:idOrSlug/resenas', authenticate, resenaController.crear);

router.post('/', authenticate, requireProductManager, productoController.crear);
router.put('/:idOrSlug', authenticate, requireProductManager, productoController.actualizar);
router.delete('/:idOrSlug', authenticate, requireProductManager, productoController.eliminar);

router.get('/:idOrSlug', optionalAuth, productoController.detail);

module.exports = router;
