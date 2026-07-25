/**
 * Capa de servicios para productos.
 * Por ahora el catálogo vive en el frontend (public/js/oasis-piercing.js).
 */
const Product = require('../models/Product');

class ProductService {
  static formatProduct(data) {
    return new Product(data);
  }
}

module.exports = ProductService;
