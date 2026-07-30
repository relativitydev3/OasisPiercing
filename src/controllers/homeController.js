const { getAppUrl } = require('../config/site');
const CatalogService = require('../services/catalogService');
const { safeScriptJson } = require('../utils/safeJson');
const storefrontFormat = require('../utils/storefrontFormat');

const EMPTY_CATALOG = Object.freeze({
  categories: [],
  products: [],
  productCount: 0,
  categoryNames: [],
});

/**
 * Renderiza la home con el catálogo cargado en servidor (CatalogService → PostgreSQL).
 * GET /api/catalog sigue disponible vía catalogController para consumo JSON externo.
 */
exports.renderHome = async (req, res, next) => {
  try {
    const appUrl = getAppUrl(req);
    let catalog = EMPTY_CATALOG;
    let catalogError = null;

    try {
      catalog = await CatalogService.getStorefrontCatalog();
    } catch (err) {
      catalogError = err.message || 'Error desconocido al consultar el catálogo';
      console.warn('[home] No se pudo cargar el catálogo:', catalogError);
    }

    res.render('pages/home', {
      appUrl,
      catalog,
      catalogJson: safeScriptJson(catalog),
      catalogError,
      ...storefrontFormat,
    });
  } catch (err) {
    next(err);
  }
};
