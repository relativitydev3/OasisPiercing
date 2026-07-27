const Categoria = require('../models/Categoria');
const Producto = require('../models/Producto');
const { getCategoryImage } = require('../config/categoryImages');
const { requireDb } = require('../utils/db');
const { stripHtml } = require('../utils/sanitize');

const CACHE_TTL_MS = 60_000;
let catalogCache = { data: null, expiresAt: 0 };

function toStorefrontProduct(row) {
  const cats = row.categorias || [];
  const primary = cats[0];
  const categorySlugs = cats.map((c) => c.slug).filter(Boolean);
  const price = Number(row.precio);

  return {
    sku: row.codigo,
    id: row.id,
    category: primary?.slug || categorySlugs[0] || 'general',
    categories: categorySlugs,
    categoryLabel: primary?.nombre || 'Catálogo',
    type: row.tipo,
    name: stripHtml(row.nombre),
    material: stripHtml(row.material),
    description: stripHtml(row.descripcion),
    emoji: '💎',
    badge: row.stock > 0 ? '✨ Disponible' : '— Agotado',
    sub: primary ? `${stripHtml(primary.nombre)} · ${stripHtml(row.tipo)}` : stripHtml(row.tipo),
    images: row.imagen
      ? [{ src: row.imagen, alt: `${stripHtml(row.nombre)} — Oasis Piercing`, fallback: '💎' }]
      : [],
    price,
    stock: row.stock,
  };
}

function toStorefrontCategory(row) {
  return {
    id: row.slug,
    label: stripHtml(row.nombre),
    descripcion: stripHtml(row.descripcion || ''),
    count: row.total_productos || 0,
    image: getCategoryImage(row.slug),
  };
}

class CatalogService {
  static invalidateCache() {
    catalogCache = { data: null, expiresAt: 0 };
  }

  static async getStorefrontCatalog({ bypassCache = false } = {}) {
    requireDb();

    const now = Date.now();
    if (!bypassCache && catalogCache.data && catalogCache.expiresAt > now) {
      return catalogCache.data;
    }

    const [categorias, productos] = await Promise.all([
      Categoria.findAllActiveForStorefront(),
      Producto.findAllActiveForStorefront(),
    ]);

    const storefrontCategories = categorias.map(toStorefrontCategory);
    const storefrontProducts = productos.map(toStorefrontProduct);

    const data = {
      categories: storefrontCategories,
      products: storefrontProducts,
      productCount: storefrontProducts.length,
      categoryNames: storefrontCategories.map((c) => c.label),
    };

    catalogCache = { data, expiresAt: now + CACHE_TTL_MS };
    return data;
  }
}

module.exports = CatalogService;
