const env = require('../config/env');
const { getSessionUser } = require('../utils/flash');
const { isDatabaseError, parseDatabaseError } = require('../utils/databaseErrors');

module.exports = (err, req, res, next) => {
  console.error(err);

  const user = getSessionUser(req);

  if (isDatabaseError(err)) {
    const db = parseDatabaseError(err);
    const payload = {
      title: db.title,
      message: db.message,
      hint: db.hint,
      code: db.code,
      detail: db.detail,
      technical: db.technical,
      stack: env.isProduction ? null : err.stack,
      user,
      csrfToken: res.locals.csrfToken,
    };

    if (req.accepts('html')) {
      return res.status(db.status).render('pages/errors/database-error', payload);
    }

    return res.status(db.status).json({
      success: false,
      error: 'database',
      message: db.message,
      hint: db.hint,
      code: db.code,
      ...(!env.isProduction && { detail: db.detail, technical: db.technical }),
    });
  }

  const status = err.status || 500;
  const exactError = err.message || 'Error interno del servidor.';
  const isServerError = status >= 500;

  const viewLocals = {
    title: `Error ${status}`,
    status,
    heading: isServerError ? 'Error interno del servidor' : 'No se pudo completar la solicitud',
    lead: isServerError
      ? 'Ocurrió un fallo inesperado. Abajo está el mensaje exacto que devolvió el servidor.'
      : null,
    exactError,
    errorName: err.name || 'Error',
    requestPath: req.originalUrl,
    stack: env.isProduction ? null : err.stack,
    user,
    csrfToken: res.locals.csrfToken,
  };

  if (req.accepts('html')) {
    if (status === 403) {
      return res.status(403).render('pages/errors/forbidden', {
        title: 'Acceso denegado',
        message: exactError,
        user,
      });
    }

    return res.status(status).render('pages/errors/server-error', viewLocals);
  }

  const jsonMessage = isServerError && env.isProduction
    ? 'Error interno del servidor.'
    : exactError;

  res.status(status).json({
    success: false,
    message: jsonMessage,
    ...(err.errors && { errors: err.errors }),
    ...(!env.isProduction && { exactError, stack: err.stack }),
  });
};
