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

  const inputBuffer = await fs.promises.readFile(file.path);
  const optimizedBuffer = await sharp(inputBuffer)
    .rotate()
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .webp({ quality: webpQuality })
    .toBuffer();

  await fs.promises.unlink(file.path).catch(() => {});
  await fs.promises.writeFile(newPath, optimizedBuffer);

  return {
    ...file,
    path: newPath,
    filename: newFilename,
    mimetype: 'image/webp',
    size: optimizedBuffer.length,
  };
}

module.exports = { processProductoUpload };
