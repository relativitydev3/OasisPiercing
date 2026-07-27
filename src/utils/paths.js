const path = require('path');

const rootDir = path.join(__dirname, '..', '..');

module.exports = {
  rootDir,
  publicDir: path.join(rootDir, 'public'),
  viewsDir: path.join(rootDir, 'views'),
  productosImagesDir: path.join(rootDir, 'public', 'images', 'productos'),
};
