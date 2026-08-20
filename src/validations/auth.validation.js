const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DIGITS_10_REGEX = /^\d{10}$/;

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateDigits10(value, { required = false, fieldLabel = 'Campo' } = {}) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) {
    return required ? `${fieldLabel} es obligatorio.` : null;
  }
  if (!/^\d+$/.test(trimmed)) {
    return `${fieldLabel} debe contener solo números.`;
  }
  if (trimmed.length !== 10) {
    return `${fieldLabel} debe tener exactamente 10 dígitos.`;
  }
  return null;
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

  const telefonoError = validateDigits10(body.telefono, { required: true, fieldLabel: 'Teléfono' });
  if (telefonoError) errors.telefono = telefonoError;

  const ccError = validateDigits10(body.cc, { required: true, fieldLabel: 'La cédula' });
  if (ccError) errors.cc = ccError;

  if (!hasValue(body.direccion)) {
    errors.direccion = 'La dirección es obligatoria.';
  } else if (body.direccion.trim().length > 500) {
    errors.direccion = 'La dirección es demasiado larga (máx. 500 caracteres).';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

module.exports = {
  validateLogin,
  validateRegister,
  EMAIL_REGEX,
  DIGITS_10_REGEX,
  hasValue,
  validateDigits10,
};
