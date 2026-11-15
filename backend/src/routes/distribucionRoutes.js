const { Router } = require('express');
const distribucionController = require('../controllers/distribucionController');
const { authenticate, optionalAuth } = require('../middlewares/auth');
const { requireDispatchOperator } = require('../middlewares/rbac');

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
  requireDispatchOperator,
  distribucionController.actualizarEstado
);
router.put(
  '/despachos/:idOrCodigo/estado',
  authenticate,
  requireDispatchOperator,
  distribucionController.actualizarEstado
);
router.post(
  '/despachos/:idOrCodigo/estado',
  authenticate,
  requireDispatchOperator,
  distribucionController.actualizarEstado
);

router.patch(
  '/tracking/:codigo/estado',
  authenticate,
  requireDispatchOperator,
  distribucionController.actualizarEstado
);
router.put(
  '/tracking/:codigo/estado',
  authenticate,
  requireDispatchOperator,
  distribucionController.actualizarEstado
);
router.post(
  '/tracking/:codigo/estado',
  authenticate,
  requireDispatchOperator,
  distribucionController.actualizarEstado
);

module.exports = router;
