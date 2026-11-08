const { Router } = require('express');
const distribucionController = require('../controllers/distribucionController');
const { authenticate, optionalAuth } = require('../middlewares/auth');
const { requireStaff, requireActiveFunction } = require('../middlewares/rbac');

const router = Router();

router.get('/cobertura', distribucionController.cobertura);
router.post('/validar-direccion', distribucionController.validarDireccion);

router.get('/tracking/:codigo', optionalAuth, distribucionController.tracking);
router.get('/rastreo/:codigo', optionalAuth, distribucionController.tracking);
router.get('/guia/:codigo', optionalAuth, distribucionController.tracking);
router.get('/despachos/:idOrCodigo', optionalAuth, distribucionController.tracking);

router.patch(
  '/despachos/:idOrCodigo/estado',
  authenticate,
  requireStaff,
  requireActiveFunction('operaciones', 'admin'),
  distribucionController.actualizarEstado
);
router.put(
  '/despachos/:idOrCodigo/estado',
  authenticate,
  requireStaff,
  requireActiveFunction('operaciones', 'admin'),
  distribucionController.actualizarEstado
);
router.post(
  '/despachos/:idOrCodigo/estado',
  authenticate,
  requireStaff,
  requireActiveFunction('operaciones', 'admin'),
  distribucionController.actualizarEstado
);

router.patch(
  '/tracking/:codigo/estado',
  authenticate,
  requireStaff,
  requireActiveFunction('operaciones', 'admin'),
  distribucionController.actualizarEstado
);
router.put(
  '/tracking/:codigo/estado',
  authenticate,
  requireStaff,
  requireActiveFunction('operaciones', 'admin'),
  distribucionController.actualizarEstado
);
router.post(
  '/tracking/:codigo/estado',
  authenticate,
  requireStaff,
  requireActiveFunction('operaciones', 'admin'),
  distribucionController.actualizarEstado
);

module.exports = router;
