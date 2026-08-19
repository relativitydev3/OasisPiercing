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

  if (!hasValue(body.telefono)) {
    errors.telefono = 'Teléfono obligatorio.';
  } else if (body.telefono.trim().length > 30) {
    errors.telefono = 'Teléfono demasiado largo.';
  }

  if (!hasValue(body.cc)) {
    errors.cc = 'La cédula es obligatoria.';
  } else if (!/^\d{1,10}$/.test(body.cc.trim())) {
    errors.cc = 'La cédula debe tener solo números (máximo 10 dígitos).';
  }

  if (!hasValue(body.direccion)) {
    errors.direccion = 'La dirección es obligatoria.';
  } else if (body.direccion.trim().length > 500) {
    errors.direccion = 'La dirección es demasiado larga (máx. 500 caracteres).';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

module.exports = { validateLogin, validateRegister, EMAIL_REGEX, hasValue };
