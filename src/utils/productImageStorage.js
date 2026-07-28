const fs = require('fs');
const path = require('path');
const { productosImagesDir, publicDir } = require('./paths');
const { toProductoRelativePath } = require('./imageFile');
const env = require('../config/env');

function isRemoteImage(storedPath) {
  return typeof storedPath === 'string' && /^https?:\/\//i.test(storedPath);
}

function blobPutOptions(extra = {}) {
  const options = { access: 'public', addRandomSuffix: false, ...extra };
  if (env.blobReadWriteToken) {
    options.token = env.blobReadWriteToken;
  }
  return options;
}

async function saveProductoImage(buffer, filename) {
  if (env.isVercel) {
    try {
      const { put } = require('@vercel/blob');
      const blob = await put(`productos/${filename}`, buffer, blobPutOptions());
      return blob.url;
    } catch (err) {
      throw new Error(
        'No se pudo guardar en Vercel Blob. Conecta un Blob store en Storage → Blob → Connect to Project y redeploy. '
        + `(${err?.message || err})`,
      );
    }
  }

  await fs.promises.mkdir(productosImagesDir, { recursive: true });
  const destPath = path.join(productosImagesDir, filename);
  await fs.promises.writeFile(destPath, buffer);
  return toProductoRelativePath(filename);
}

async function deleteStoredProductoImage(storedPath) {
  if (!storedPath) return;

  if (isRemoteImage(storedPath)) {
    try {
      const { del } = require('@vercel/blob');
      const options = env.blobReadWriteToken ? { token: env.blobReadWriteToken } : {};
      await del(storedPath, options);
    } catch {
      /* ya eliminada */
    }
    return;
  }

  const fullPath = path.join(publicDir, storedPath.replace(/^\//, ''));
  if (!fullPath.startsWith(productosImagesDir)) return;
  await fs.promises.unlink(fullPath).catch(() => {});
}

module.exports = {
  isRemoteImage,
  saveProductoImage,
  deleteStoredProductoImage,
};
