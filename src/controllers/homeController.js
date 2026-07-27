const fs = require('fs');
const path = require('path');
const env = require('../config/env');
const { getAppUrl } = require('../config/site');
const CatalogService = require('../services/catalogService');
const { safeScriptJson } = require('../utils/safeJson');
const { viewsDir } = require('../utils/paths');

const homePath = path.join(viewsDir, 'pages', 'home.html');
const EMPTY_CATALOG = 'window.OASIS_CATALOG = {"categories":[],"products":[],"productCount":0,"categoryNames":[]};';

let homeTemplate = null;

function getHomeTemplate() {
  if (!homeTemplate || !env.isProduction) {
    homeTemplate = fs.readFileSync(homePath, 'utf8');
  }
  return homeTemplate;
}

exports.renderHome = async (req, res, next) => {
  try {
    const appUrl = getAppUrl(req);
    let catalogScript = EMPTY_CATALOG;

    try {
      const catalog = await CatalogService.getStorefrontCatalog();
      catalogScript = `window.OASIS_CATALOG = ${safeScriptJson(catalog)};`;
    } catch (err) {
      console.warn('[home] No se pudo cargar el catálogo:', err.message);
    }

    const html = getHomeTemplate()
      .replace(/\{\{APP_URL\}\}/g, appUrl)
      .replace('{{OASIS_CATALOG}}', catalogScript);

    res.type('html').send(html);
  } catch (err) {
    next(err);
  }
};
