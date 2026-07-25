/**
 * Modelo base de producto.
 * Preparado para conectar con una base de datos más adelante.
 */
class Product {
  constructor(data = {}) {
    this.sku = data.sku;
    this.category = data.category;
    this.categoryLabel = data.categoryLabel;
    this.type = data.type;
    this.name = data.name;
    this.material = data.material;
    this.description = data.description;
    this.images = data.images || [];
    this.price = data.price;
    this.oldPrice = data.oldPrice;
    this.badge = data.badge;
    this.emoji = data.emoji;
  }
}

module.exports = Product;
