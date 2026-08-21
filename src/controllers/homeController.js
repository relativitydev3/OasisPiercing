const { getAppUrl } = require('../config/site');
const CatalogService = require('../services/catalogService');
const { safeScriptJson } = require('../utils/safeJson');
const storefrontFormat = require('../utils/storefrontFormat');
const { isDatabaseError, formatDatabaseErrorBrief } = require('../utils/databaseErrors');

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
      catalogError = isDatabaseError(err)
        ? formatDatabaseErrorBrief(err)
        : (err.message || 'Error desconocido al consultar el catálogo');
      console.warn('[home] No se pudo cargar el catálogo:', catalogError);
    }

    res.render('pages/home', {
      appUrl,
      catalog,
      catalogJson: safeScriptJson(catalog),
      storeBootstrapJson: safeScriptJson({
        csrfToken: res.locals.csrfToken || '',
        user: req.session?.user
          ? {
            nombre: req.session.user.nombre,
            apellido: req.session.user.apellido,
            email: req.session.user.email,
            telefono: req.session.user.telefono,
            cc: req.session.user.cc,
            direccion: req.session.user.direccion,
          }
          : null,
      }),
      catalogError,
      ...storefrontFormat,
    });
  } catch (err) {
    next(err);
  }
};
