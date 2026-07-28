const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { productosImagesDir } = require('./paths');
const { width, height, webpQuality } = require('../config/productImage');

async function getUploadBuffer(file) {
  if (file?.buffer) return file.buffer;
  if (file?.path) {
    return fs.promises.readFile(file.path);
  }
  throw new Error('No se recibió ninguna imagen.');
}

async function processProductoUpload(file) {
  if (!file?.path) return file;

  const base = path.basename(file.filename, path.extname(file.filename));
  const newFilename = `${base}.webp`;
  const newPath = path.join(productosImagesDir, newFilename);
  const tempPath = `${newPath}.tmp`;

  await fs.promises.mkdir(productosImagesDir, { recursive: true });

  await sharp(file.path)
    .rotate()
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .webp({ quality: webpQuality })
    .toFile(tempPath);

  await fs.promises.unlink(file.path).catch(() => {});
  await fs.rename(tempPath, newPath);

  const stats = await fs.promises.stat(newPath);

  return {
    ...file,
    path: newPath,
    filename: newFilename,
    mimetype: 'image/webp',
    size: stats.size,
  };
}

module.exports = { processProductoUpload, getUploadBuffer };
