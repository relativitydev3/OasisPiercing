function authMiddleware(req, res, next) {
  if (!req.session.user) {
    if (req.accepts('html')) {
      req.session.returnTo = req.originalUrl;
      return res.redirect('/login');
    }
    return res.status(401).json({ success: false, message: 'No autorizado.' });
  }
  next();
}

module.exports = authMiddleware;
