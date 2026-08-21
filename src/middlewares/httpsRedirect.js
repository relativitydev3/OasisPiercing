const env = require('../config/env');

/** Redirige HTTP → HTTPS en producción (requisito para HSTS preload). */
function httpsRedirect(req, res, next) {
  if (!env.isProduction) return next();

  const forwardedProto = req.headers['x-forwarded-proto'];
  if (req.secure || forwardedProto === 'https') return next();

  const host = req.get('host');
  if (!host) return next();

  return res.redirect(301, `https://${host}${req.originalUrl}`);
}

module.exports = httpsRedirect;
