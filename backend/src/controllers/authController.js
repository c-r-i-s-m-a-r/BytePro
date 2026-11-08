const authService = require('../services/authService');
const AppError = require('../utils/AppError');

async function register(req, res, next) {
  try {
    const data = await authService.register(req.body || {});
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const data = await authService.login(req.body || {});
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function loginEmpresa(req, res, next) {
  try {
    const data = await authService.login(req.body || {});
    if (data.user.rol === 'cliente') {
      throw new AppError('Credenciales incorrectas', 401);
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  res.json({ user: req.user.toSafeJSON() });
}

async function cambiarFuncionActiva(req, res, next) {
  try {
    const { funcion } = req.body || {};
    if (!funcion) {
      throw new AppError('Debes especificar la función a la cual cambiar', 400);
    }
    const roles = req.user.getRolesList();
    if (!roles.includes(funcion) && req.user.rol !== 'admin') {
      throw new AppError('No tienes asignada esa función en tu cuenta', 403);
    }

    req.user.funcionActiva = funcion;
    await req.user.save();

    const { signToken } = require('../utils/jwt');
    const token = signToken({
      sub: req.user.id,
      rol: req.user.rol,
      funcionActiva: funcion,
    });

    res.json({
      user: req.user.toSafeJSON(),
      token,
      message: `Función activa cambiada a ${funcion}`,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, loginEmpresa, me, cambiarFuncionActiva };
