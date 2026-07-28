const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');
const CatalogService = require('./catalogService');
const { generateUniqueSlug } = require('../utils/slug');
const { toProductoRelativePath, deleteProductoImage } = require('../utils/imageFile');
const { stripHtml } = require('../utils/sanitize');
const { requireDb } = require('../utils/db');
const { AppError } = require('../utils/errors');

class ProductoService {
  static async findAll() {
    requireDb();
    return Producto.findAllWithCategorias();
  }

  static async findById(id) {
    requireDb();
    const producto = await Producto.findById(id);
    if (!producto) throw new AppError('Producto no encontrado.', 404);
    return producto;
  }

  static async codigoExists(codigo, excludeId = null) {
    requireDb();
    return Producto.codigoExists(codigo.trim(), excludeId);
  }

  static async validateCategoriaIds(categoriaIds) {
    requireDb();
    const count = await Categoria.countActiveByIds(categoriaIds);
    return count === categoriaIds.length;
  }

  static sanitizePayload(data) {
    return {
      ...data,
      nombre: stripHtml(data.nombre),
      codigo: stripHtml(data.codigo),
      tipo: stripHtml(data.tipo),
      material: stripHtml(data.material),
      descripcion: stripHtml(data.descripcion),
    };
  }

  static async create(data, categoriaIds) {
    requireDb();

    if (!(await this.validateCategoriaIds(categoriaIds))) {
      throw new AppError('Una o más categorías seleccionadas no son válidas.', 400);
    }

    const clean = this.sanitizePayload(data);
    const slug = await generateUniqueSlug(
      clean.nombre,
      (candidate, excludeId) => Producto.slugExists(candidate, excludeId),
    );

    const productoId = await Producto.create({ ...clean, slug });
    await Producto.setCategorias(productoId, categoriaIds);
    CatalogService.invalidateCache();
    return Producto.findById(productoId);
  }

  static async update(id, data, categoriaIds) {
    requireDb();
    const current = await Producto.findById(id);
    if (!current) throw new AppError('Producto no encontrado.', 404);

    if (!(await this.validateCategoriaIds(categoriaIds))) {
      throw new AppError('Una o más categorías seleccionadas no son válidas.', 400);
    }

    const clean = this.sanitizePayload(data);
    const slug = await generateUniqueSlug(
      clean.nombre,
      (candidate, excludeId) => Producto.slugExists(candidate, excludeId),
      id,
    );

    await Producto.update(id, { ...clean, slug });
    await Producto.setCategorias(id, categoriaIds);
    CatalogService.invalidateCache();
    return Producto.findById(id);
  }

  static async toggleActive(id, activo) {
    requireDb();
    const updated = await Producto.toggleActive(id, activo);
    if (!updated) throw new AppError('Producto no encontrado.', 404);
    CatalogService.invalidateCache();
    return Producto.findById(id);
  }

  static async delete(id) {
    requireDb();
    const deleted = await Producto.delete(id);
    if (!deleted) throw new AppError('Producto no encontrado.', 404);

    if (deleted.imagen) {
      deleteProductoImage(deleted.imagen);
    }

    CatalogService.invalidateCache();
    return true;
  }

  static buildImagePath(file) {
    if (!file) return null;
    return toProductoRelativePath(file.filename);
  }

  static replaceImage(oldPath, newFile) {
    if (newFile) {
      if (oldPath) deleteProductoImage(oldPath);
      return toProductoRelativePath(newFile.filename);
    }
    return oldPath;
  }

  static discardUploadedFile(file) {
    if (file?.path) deleteProductoImage(toProductoRelativePath(file.filename));
  }
}

module.exports = ProductoService;
