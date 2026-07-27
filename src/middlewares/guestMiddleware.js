const AuthService = require('../services/authService');

function guestMiddleware(req, res, next) {
  if (req.session.user) {
    return res.redirect(AuthService.getRedirectPath(req.session.user));
  }
  next();
}

module.exports = guestMiddleware;
