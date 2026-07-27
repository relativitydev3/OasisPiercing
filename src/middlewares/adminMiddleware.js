const { isAdmin } = require('../config/roles');

function adminMiddleware(req, res, next) {
  if (!req.session.user) {
    if (req.accepts('html')) return res.redirect('/login');
    return res.status(401).json({ success: false, message: 'No autorizado.' });
  }

  if (!isAdmin(req.session.user.rol_id)) {
    if (req.accepts('html')) {
      return res.status(403).render('pages/errors/forbidden', {
        title: 'Acceso denegado',
      });
    }
    return res.status(403).json({ success: false, message: 'No tiene permisos.' });
  }

  next();
}

module.exports = adminMiddleware;
