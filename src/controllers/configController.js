const { getClientConfig } = require('../config/site');
const CatalogService = require('../services/catalogService');
const { safeScriptJson } = require('../utils/safeJson');

exports.getClientConfig = async (req, res, next) => {
  try {
    const config = getClientConfig(req);

    try {
      const catalog = await CatalogService.getStorefrontCatalog();
      config.categories = catalog.categoryNames;
      config.productCount = catalog.productCount;
    } catch (err) {
      console.warn('[config] Catálogo no disponible:', err.message);
    }

    res.set('Cache-Control', 'public, max-age=60');
    res.type('application/javascript');
    res.send(`window.OASIS_CONFIG = ${safeScriptJson(config)};`);
  } catch (err) {
    next(err);
  }
};
