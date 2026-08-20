const { ROLES } = require('../config/roles');
const { EMAIL_REGEX, hasValue, validateDigits10 } = require('./auth.validation');

function validateUserForm(body, { isCreate, requirePassword = false } = {}) {
  const errors = {};

  if (!hasValue(body.nombre)) errors.nombre = 'Nombre obligatorio.';
  if (body.nombre && body.nombre.trim().length > 80) errors.nombre = 'Nombre demasiado largo.';

  if (body.apellido && body.apellido.trim().length > 80) {
    errors.apellido = 'Apellido demasiado largo.';
  }

  if (!hasValue(body.email)) errors.email = 'Email obligatorio.';
  else if (!EMAIL_REGEX.test(body.email.trim())) errors.email = 'Email inválido.';

  const rolId = Number(body.rol_id);
  if (![ROLES.CLIENTE, ROLES.ADMINISTRADOR].includes(rolId)) {
    errors.rol_id = 'Rol inválido.';
  }

  if (body.telefono) {
    const telefonoError = validateDigits10(body.telefono, { fieldLabel: 'Teléfono' });
    if (telefonoError) errors.telefono = telefonoError;
  }

  if (body.cc) {
    const ccError = validateDigits10(body.cc, { fieldLabel: 'Cédula' });
    if (ccError) errors.cc = ccError;
  }

  if (body.direccion && body.direccion.trim().length > 500) {
    errors.direccion = 'La dirección es demasiado larga (máx. 500 caracteres).';
  }

  const passwordProvided = hasValue(body.password);
  if (isCreate || requirePassword) {
    if (!passwordProvided) errors.password = 'Contraseña obligatoria.';
    else if (body.password.length < 8) errors.password = 'La contraseña debe tener al menos 8 caracteres.';
  } else if (passwordProvided && body.password.length < 8) {
    errors.password = 'La contraseña debe tener al menos 8 caracteres.';
  }

  if (passwordProvided || (isCreate && hasValue(body.confirmar_password))) {
    if (body.password !== body.confirmar_password) {
      errors.confirmar_password = 'Las contraseñas no coinciden.';
    }
  }

  return { isValid: Object.keys(errors).length === 0, errors, rolId };
}

module.exports = { validateUserForm };
