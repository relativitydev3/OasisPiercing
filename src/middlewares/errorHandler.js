const env = require('../config/env');

module.exports = (err, req, res, next) => {
  console.error(err);

  const status = err.status || 500;
  const isServerError = status >= 500;
  const message = isServerError && env.isProduction
    ? 'Error interno del servidor.'
    : (err.message || 'Error interno del servidor.');

  if (req.accepts('html')) {
    if (status === 403) {
      return res.status(403).render('pages/errors/forbidden', {
        title: 'Acceso denegado',
        message,
      });
    }

    return res.status(status).render('pages/errors/server-error', {
      title: 'Error',
      message,
      status,
      stack: env.isProduction ? null : err.stack,
    });
  }

  res.status(status).json({
    success: false,
    message,
    ...(err.errors && { errors: err.errors }),
    ...(!env.isProduction && { stack: err.stack }),
  });
};
