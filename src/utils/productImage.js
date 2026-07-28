const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { productosImagesDir } = require('./paths');
const { width, height, webpQuality } = require('../config/productImage');

async function processProductoUpload(file) {
  if (!file?.path) return file;

  const base = path.basename(file.filename, path.extname(file.filename));
  const newFilename = `${base}.webp`;
  const newPath = path.join(productosImagesDir, newFilename);
  const tempPath = `${newPath}.tmp`;

  await sharp(file.path)
    .rotate()
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .webp({ quality: webpQuality })
    .toFile(tempPath);

  fs.unlink(file.path, () => {});
  fs.renameSync(tempPath, newPath);

  const stats = fs.statSync(newPath);

  return {
    ...file,
    path: newPath,
    filename: newFilename,
    mimetype: 'image/webp',
    size: stats.size,
  };
}

module.exports = { processProductoUpload };
