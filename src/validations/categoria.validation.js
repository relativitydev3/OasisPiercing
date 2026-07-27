const { hasValue } = require('./auth.validation');

function validateCategoriaForm(body) {
  const errors = {};

  if (!hasValue(body.nombre)) {
    errors.nombre = 'El nombre es obligatorio.';
  } else if (body.nombre.trim().length > 120) {
    errors.nombre = 'El nombre es demasiado largo (máx. 120 caracteres).';
  }

  if (body.descripcion && body.descripcion.trim().length > 500) {
    errors.descripcion = 'La descripción es demasiado larga (máx. 500 caracteres).';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

module.exports = { validateCategoriaForm };
