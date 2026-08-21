const crypto = require('crypto');
const helmet = require('helmet');
const env = require('../config/env');

function cspNonce(req, res, next) {
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
  next();
}

function buildHsts() {
  if (!env.isProduction) return false;

  const appUrl = String(env.appUrl || '');
  if (/^http:\/\/(localhost|127\.0\.0\.1)/i.test(appUrl)) return false;

  const maxAge = Number(process.env.HSTS_MAX_AGE) || 31_536_000; // 1 año (mínimo para preload)

  return {
    maxAge,
    includeSubDomains: process.env.HSTS_INCLUDE_SUBDOMAINS !== 'false',
    preload: process.env.HSTS_PRELOAD !== 'false',
  };
}

const helmetCsp = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // nonce + strict-dynamic protegen en navegadores modernos; los fallbacks
      // siguientes se ignoran ahí pero mejoran compatibilidad (recomendación Lighthouse).
      scriptSrc: [
        "'self'",
        (req, res) => `'nonce-${res.locals.cspNonce}'`,
        "'strict-dynamic'",
        "'unsafe-inline'",
        'https:',
        'http:',
      ],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      scriptSrcAttr: ["'none'"],
      requireTrustedTypesFor: ["'script'"],
      trustedTypes: ['oasis', 'default'],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: buildHsts(),
});

module.exports = { cspNonce, helmetCsp };
