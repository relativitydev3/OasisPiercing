function setFlash(req, type, message) {
  req.session.flash = { type, message };
}

function setFormErrors(req, errors, old = {}) {
  req.session.formErrors = errors;
  req.session.oldInput = old;
}

function consumeFlash(req) {
  const flash = req.session.flash || null;
  delete req.session.flash;
  return flash;
}

function consumeFormState(req) {
  const errors = req.session.formErrors || {};
  const old = req.session.oldInput || {};
  delete req.session.formErrors;
  delete req.session.oldInput;
  return { errors, old };
}

function localsMiddleware(req, res, next) {
  res.locals.user = req.session.user || null;
  res.locals.flash = consumeFlash(req);
  const formState = consumeFormState(req);
  res.locals.errors = formState.errors;
  res.locals.old = formState.old;
  next();
}

module.exports = {
  setFlash,
  setFormErrors,
  consumeFlash,
  consumeFormState,
  localsMiddleware,
};
