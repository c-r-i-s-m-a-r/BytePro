const { Router } = require('express');
const soporteController = require('../controllers/soporteController');
const { authenticate, optionalAuth } = require('../middlewares/auth');
const { requireStaff, requireActiveFunction } = require('../middlewares/rbac');

const router = Router();

// REQ-SOP-01 / REQ-SOP-02: Creación pública o autenticada de reclamos/ayuda
router.post('/reclamos', optionalAuth, soporteController.crear);
router.post('/ayuda', optionalAuth, soporteController.crear);
router.post('/tickets', optionalAuth, soporteController.crear);

// Consulta individual de ticket por código o ID
router.get('/reclamos/:idOrCodigo', optionalAuth, soporteController.detalle);
router.get('/tickets/:idOrCodigo', optionalAuth, soporteController.detalle);

// REQ-SOP-04 a REQ-SOP-07: Gestión interna restringida a soporte o admin
router.get(
  '/admin/reclamos',
  authenticate,
  requireStaff,
  requireActiveFunction('soporte', 'admin'),
  soporteController.listar
);
router.get(
  '/admin/tickets',
  authenticate,
  requireStaff,
  requireActiveFunction('soporte', 'admin'),
  soporteController.listar
);

router.post(
  '/reclamos/:idOrCodigo/tomar',
  authenticate,
  requireStaff,
  requireActiveFunction('soporte', 'admin'),
  soporteController.tomarCaso
);
router.patch(
  '/reclamos/:idOrCodigo/tomar',
  authenticate,
  requireStaff,
  requireActiveFunction('soporte', 'admin'),
  soporteController.tomarCaso
);

router.post(
  '/reclamos/:idOrCodigo/resolver',
  authenticate,
  requireStaff,
  requireActiveFunction('soporte', 'admin'),
  soporteController.resolverCaso
);
router.patch(
  '/reclamos/:idOrCodigo/resolver',
  authenticate,
  requireStaff,
  requireActiveFunction('soporte', 'admin'),
  soporteController.resolverCaso
);

module.exports = router;
