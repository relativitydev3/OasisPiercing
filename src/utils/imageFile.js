const fs = require('fs');
const path = require('path');
const { publicDir } = require('./paths');

const PRODUCTOS_PREFIX = '/images/productos/';

function toProductoRelativePath(filename) {
  return `${PRODUCTOS_PREFIX}${filename}`;
}

function deleteProductoImage(relativePath) {
  if (!relativePath || !relativePath.startsWith(PRODUCTOS_PREFIX)) return;

  const fullPath = path.join(publicDir, relativePath.replace(/^\//, ''));
  fs.unlink(fullPath, () => {});
}

module.exports = {
  PRODUCTOS_PREFIX,
  toProductoRelativePath,
  deleteProductoImage,
};
