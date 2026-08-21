const crypto = require('crypto');
const helmet = require('helmet');

function cspNonce(req, res, next) {
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
  next();
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
    },
  },
  crossOriginEmbedderPolicy: false,
});

module.exports = { cspNonce, helmetCsp };
