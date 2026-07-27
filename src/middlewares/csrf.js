const crypto = require('crypto');
const { AppError } = require('../utils/errors');

function ensureCsrfToken(req) {
  if (!req.session) return null;
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  return req.session.csrfToken;
}

function csrfLocals(req, res, next) {
  res.locals.csrfToken = ensureCsrfToken(req);
  next();
}

function validateCsrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const token = req.body?._csrf || req.headers['x-csrf-token'];
  if (token && req.session?.csrfToken && token === req.session.csrfToken) {
    return next();
  }

  next(new AppError('Solicitud no válida. Recarga la página e intenta de nuevo.', 403));
}

module.exports = { csrfLocals, validateCsrf };
