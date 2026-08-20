const { EMAIL_REGEX, hasValue, validateDigits10 } = require('./auth.validation');

function validateProfileForm(body) {
  const errors = {};

  if (!hasValue(body.nombre)) errors.nombre = 'Nombre obligatorio.';
  else if (body.nombre.trim().length > 80) errors.nombre = 'Nombre demasiado largo.';

  if (!hasValue(body.apellido)) errors.apellido = 'Apellido obligatorio.';
  else if (body.apellido.trim().length > 80) errors.apellido = 'Apellido demasiado largo.';

  if (!hasValue(body.email)) errors.email = 'Email obligatorio.';
  else if (!EMAIL_REGEX.test(body.email.trim())) errors.email = 'Email inválido.';

  const telefonoError = validateDigits10(body.telefono, { required: true, fieldLabel: 'Teléfono' });
  if (telefonoError) errors.telefono = telefonoError;

  const ccError = validateDigits10(body.cc, { required: true, fieldLabel: 'Cédula' });
  if (ccError) errors.cc = ccError;

  if (!hasValue(body.direccion)) {
    errors.direccion = 'La dirección es obligatoria.';
  } else if (body.direccion.trim().length > 500) {
    errors.direccion = 'La dirección es demasiado larga (máx. 500 caracteres).';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

module.exports = { validateProfileForm };
