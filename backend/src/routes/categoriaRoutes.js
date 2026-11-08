const { Router } = require('express');
const categoriaController = require('../controllers/categoriaController');
const { authenticate } = require('../middlewares/auth');
const { requireStaff, requireActiveFunction } = require('../middlewares/rbac');

const router = Router();

router.get('/', categoriaController.list);
router.get('/:idOrSlug', categoriaController.detail);
router.post('/', authenticate, requireStaff, requireActiveFunction('vendedor', 'admin'), categoriaController.crear);

module.exports = router;
