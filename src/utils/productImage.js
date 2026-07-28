const path = require('path');
const sharp = require('sharp');
const { width, height, webpQuality } = require('../config/productImage');
const { saveProductoImage } = require('./productImageStorage');

function safeBasename(originalname) {
  const ext = path.extname(originalname || '').toLowerCase();
  const base = path
    .basename(originalname || 'producto', ext)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/gi, '-')
    .toLowerCase()
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'producto';

  return base;
}

async function getUploadBuffer(file) {
  if (file?.buffer) return file.buffer;
  if (file?.path) {
    const fs = require('fs');
    return fs.promises.readFile(file.path);
  }
  throw new Error('No se recibió ninguna imagen.');
}

async function processProductoUpload(file) {
  if (!file?.buffer) return file;

  const newFilename = `${safeBasename(file.originalname)}-${Date.now()}.webp`;

  const optimizedBuffer = await sharp(file.buffer)
    .rotate()
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .webp({ quality: webpQuality })
    .toBuffer();

  const storedPath = await saveProductoImage(optimizedBuffer, newFilename);

  return {
    ...file,
    filename: newFilename,
    storedPath,
    mimetype: 'image/webp',
    size: optimizedBuffer.length,
  };
}

module.exports = { processProductoUpload, getUploadBuffer };
