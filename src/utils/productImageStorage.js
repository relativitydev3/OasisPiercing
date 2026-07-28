const fs = require('fs');
const path = require('path');
const { productosImagesDir, publicDir } = require('./paths');
const { toProductoRelativePath } = require('./imageFile');
const env = require('../config/env');

function isRemoteImage(storedPath) {
  return typeof storedPath === 'string' && /^https?:\/\//i.test(storedPath);
}

async function saveProductoImage(buffer, filename) {
  if (env.blobReadWriteToken) {
    const { put } = require('@vercel/blob');
    const blob = await put(`productos/${filename}`, buffer, {
      access: 'public',
      token: env.blobReadWriteToken,
      addRandomSuffix: false,
    });
    return blob.url;
  }

  if (env.isVercel) {
    throw new Error(
      'En Vercel debes configurar BLOB_READ_WRITE_TOKEN para guardar imágenes. '
      + 'Créalo en Vercel → Storage → Blob → Connect.',
    );
  }

  await fs.promises.mkdir(productosImagesDir, { recursive: true });
  const destPath = path.join(productosImagesDir, filename);
  await fs.promises.writeFile(destPath, buffer);
  return toProductoRelativePath(filename);
}

async function deleteStoredProductoImage(storedPath) {
  if (!storedPath) return;

  if (isRemoteImage(storedPath)) {
    if (!env.blobReadWriteToken) return;
    try {
      const { del } = require('@vercel/blob');
      await del(storedPath, { token: env.blobReadWriteToken });
    } catch {
      /* archivo ya eliminado o inaccesible */
    }
    return;
  }

  const relative = storedPath.replace(/^\//, '');
  const fullPath = path.join(publicDir, relative);
  if (!fullPath.startsWith(productosImagesDir)) return;

  await fs.promises.unlink(fullPath).catch(() => {});
}

module.exports = {
  isRemoteImage,
  saveProductoImage,
  deleteStoredProductoImage,
};
