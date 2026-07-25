const env = require('../config/env');

module.exports = (err, req, res, next) => {
  console.error(err);

  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(status).json({
    success: false,
    message,
    ...(env.nodeEnv === 'development' && { stack: err.stack }),
  });
};
