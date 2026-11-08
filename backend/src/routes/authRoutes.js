const { Router } = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/login-empresa', authController.loginEmpresa);
router.get('/me', authenticate, authController.me);
router.post('/cambiar-funcion', authenticate, authController.cambiarFuncionActiva);
router.patch('/cambiar-funcion', authenticate, authController.cambiarFuncionActiva);

module.exports = router;
