/**
 * Validaciones de datos.
 * Listo para usar con Joi o express-validator cuando haya formularios/API.
 */
const productValidation = {
  isValidSku(sku) {
    return typeof sku === 'string' && /^OP-[A-Z]{3}-[A-Z]{3}-\d{3}$/.test(sku);
  },
};

module.exports = { productValidation };
