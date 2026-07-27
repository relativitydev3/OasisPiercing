const Categoria = require('../models/Categoria');
const CatalogService = require('./catalogService');
const { generateUniqueSlug } = require('../utils/slug');
const { stripHtml } = require('../utils/sanitize');
const { requireDb } = require('../utils/db');
const { AppError } = require('../utils/errors');

class CategoriaService {
  static async findAll() {
    requireDb();
    return Categoria.findAllWithProductCount();
  }

  static async findAllForSelect() {
    requireDb();
    return Categoria.findAll();
  }

  static async findById(id) {
    requireDb();
    const categoria = await Categoria.findById(id);
    if (!categoria) throw new AppError('Categoría no encontrada.', 404);
    return categoria;
  }

  static async nombreExists(nombre, excludeId = null) {
    requireDb();
    return Categoria.nombreExists(nombre.trim(), excludeId);
  }

  static async create({ nombre, descripcion, activo }) {
    requireDb();

    const slug = await generateUniqueSlug(
      nombre,
      (candidate, excludeId) => Categoria.slugExists(candidate, excludeId),
    );

    const result = await Categoria.create({
      nombre: stripHtml(nombre),
      slug,
      descripcion: stripHtml(descripcion) || null,
      activo: activo ?? true,
    });

    CatalogService.invalidateCache();
    return result;
  }

  static async update(id, { nombre, descripcion }) {
    requireDb();
    const current = await Categoria.findById(id);
    if (!current) throw new AppError('Categoría no encontrada.', 404);

    const slug = await generateUniqueSlug(
      nombre,
      (candidate, excludeId) => Categoria.slugExists(candidate, excludeId),
      id,
    );

    const result = await Categoria.update(id, {
      nombre: stripHtml(nombre),
      slug,
      descripcion: stripHtml(descripcion) || null,
    });

    CatalogService.invalidateCache();
    return result;
  }

  static async toggleActive(id, activo) {
    requireDb();
    const updated = await Categoria.toggleActive(id, activo);
    if (!updated) throw new AppError('Categoría no encontrada.', 404);
    CatalogService.invalidateCache();
    return Categoria.findById(id);
  }

  static async delete(id) {
    requireDb();
    const deleted = await Categoria.delete(id);
    if (!deleted) throw new AppError('Categoría no encontrada.', 404);
    CatalogService.invalidateCache();
    return true;
  }
}

module.exports = CategoriaService;
