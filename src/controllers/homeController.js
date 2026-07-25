const fs = require('fs');
const path = require('path');
const { getAppUrl } = require('../config/site');
const { viewsDir } = require('../utils/paths');

const homePath = path.join(viewsDir, 'pages', 'home.html');

exports.renderHome = (req, res, next) => {
  try {
    const appUrl = getAppUrl(req);
    const html = fs.readFileSync(homePath, 'utf8').replace(/\{\{APP_URL\}\}/g, appUrl);
    res.type('html').send(html);
  } catch (err) {
    next(err);
  }
};
