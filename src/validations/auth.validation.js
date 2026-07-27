const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateLogin(body) {
  const errors = {};

  if (!hasValue(body.email)) errors.email = 'Email obligatorio.';
  else if (!EMAIL_REGEX.test(body.email.trim())) errors.email = 'Email inválido.';

  if (!hasValue(body.password)) errors.password = 'Contraseña obligatoria.';

  return { isValid: Object.keys(errors).length === 0, errors };
}

function validateRegister(body) {
  const errors = {};

  if (!hasValue(body.nombre)) errors.nombre = 'Nombre obligatorio.';

  if (!hasValue(body.email)) errors.email = 'Email obligatorio.';
  else if (!EMAIL_REGEX.test(body.email.trim())) errors.email = 'Email inválido.';

  if (!hasValue(body.password)) errors.password = 'Contraseña obligatoria.';
  else if (body.password.length < 8) errors.password = 'La contraseña debe tener al menos 8 caracteres.';

  if (!hasValue(body.confirmar_password)) errors.confirmar_password = 'Confirma tu contraseña.';
  else if (body.password !== body.confirmar_password) {
    errors.confirmar_password = 'Las contraseñas no coinciden.';
  }

  if (body.telefono && body.telefono.trim().length > 30) {
    errors.telefono = 'Teléfono demasiado largo.';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

module.exports = { validateLogin, validateRegister, EMAIL_REGEX, hasValue };
