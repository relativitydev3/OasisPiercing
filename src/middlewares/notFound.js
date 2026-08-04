const { getSessionUser } = require('../utils/flash');

module.exports = (req, res) => {
  if (req.accepts('html')) {
    return res.status(404).render('pages/errors/not-found', {
      title: 'Página no encontrada',
      user: getSessionUser(req),
    });
  }

  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    path: req.originalUrl,
  });
};
