const AuthService = require('../services/authService');
const { validateLogin, validateRegister } = require('../validations/auth.validation');
const { setFlash, setFormErrors } = require('../utils/flash');
const { AppError } = require('../utils/errors');

function regenerateSession(req, payload = {}) {
  return new Promise((resolve, reject) => {
    const preserved = {
      returnTo: req.session.returnTo,
      flash: req.session.flash,
      formErrors: req.session.formErrors,
      oldInput: req.session.oldInput,
      csrfToken: req.session.csrfToken,
      ...payload,
    };

    req.session.regenerate((err) => {
      if (err) return reject(err);
      Object.assign(req.session, preserved);
      resolve();
    });
  });
}

exports.showLogin = (req, res) => {
  if (req.query.pedido === '1') {
    req.session.returnTo = '/';
  }
  res.render('pages/auth/login', {
    title: 'Iniciar sesión',
    page: 'login',
    fromCheckout: req.query.pedido === '1',
  });
};

exports.login = async (req, res, next) => {
  try {
    const validation = validateLogin(req.body);
    if (!validation.isValid) {
      setFormErrors(req, validation.errors, req.body);
      return res.redirect('/login');
    }

    const user = await AuthService.login(req.body.email.trim(), req.body.password);
    await regenerateSession(req, { user });

    const redirectTo = req.session.returnTo || AuthService.getRedirectPath(user);
    delete req.session.returnTo;

    setFlash(req, 'success', `Bienvenido, ${user.nombre}.`);
    res.redirect(redirectTo);
  } catch (err) {
    if (err instanceof AppError && err.errors) {
      setFormErrors(req, err.errors, req.body);
      return res.redirect('/login');
    }
    next(err);
  }
};

exports.showRegister = (req, res) => {
  if (req.query.pedido === '1') {
    req.session.returnTo = '/';
  }
  res.render('pages/auth/register', {
    title: 'Crear cuenta',
    page: 'register',
    fromCheckout: req.query.pedido === '1',
  });
};

exports.register = async (req, res, next) => {
  try {
    const validation = validateRegister(req.body);
    if (!validation.isValid) {
      setFormErrors(req, validation.errors, req.body);
      return res.redirect('/registro');
    }

    const user = await AuthService.register({
      nombre: req.body.nombre.trim(),
      apellido: req.body.apellido?.trim() || null,
      email: req.body.email.trim(),
      telefono: req.body.telefono.trim(),
      cc: req.body.cc.trim(),
      direccion: req.body.direccion.trim(),
      password: req.body.password,
    });

    await regenerateSession(req, { user });
    setFlash(req, 'success', 'Cuenta creada correctamente.');
    const redirectTo = req.session.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(redirectTo);
  } catch (err) {
    if (err instanceof AppError && err.errors) {
      setFormErrors(req, err.errors, req.body);
      return res.redirect('/registro');
    }
    next(err);
  }
};

exports.logout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('oasis.sid');
    res.redirect('/login');
  });
};
