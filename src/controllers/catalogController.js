const CatalogService = require('../services/catalogService');

exports.getCatalog = async (req, res, next) => {
  try {
    const catalog = await CatalogService.getStorefrontCatalog();
    res.set('Cache-Control', 'public, max-age=60');
    res.json(catalog);
  } catch (err) {
    next(err);
  }
};
