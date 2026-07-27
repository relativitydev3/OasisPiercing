const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Demasiados intentos. Espera unos minutos e intenta de nuevo.',
  skipSuccessfulRequests: true,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Demasiados registros desde esta IP. Intenta más tarde.',
});

module.exports = { authLimiter, registerLimiter };
