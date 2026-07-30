const fs = require('fs');
const path = require('path');
const { productosImagesDir, publicDir } = require('./paths');
const { toProductoRelativePath } = require('./imageFile');
const env = require('../config/env');

const MEDIA_PREFIX = '/media/productos/';

function isRemoteImage(storedPath) {
  return typeof storedPath === 'string' && /^https?:\/\//i.test(storedPath);
}

function isMediaProxyPath(storedPath) {
  return typeof storedPath === 'string' && storedPath.startsWith(MEDIA_PREFIX);
}

function mediaPathToBlobPathname(storedPath) {
  const filename = path.basename(storedPath);
  return `productos/${filename}`;
}

function blobAuthOptions() {
  return env.blobReadWriteToken ? { token: env.blobReadWriteToken } : {};
}

function blobPutOptions(access, extra = {}) {
  return {
    access,
    addRandomSuffix: false,
    ...blobAuthOptions(),
    ...extra,
  };
}

function resolveBlobAccess() {
  if (env.blobAccess === 'private' || env.blobAccess === 'public') {
    return env.blobAccess;
  }
  return 'public';
}

async function readStoredProductoImage(storedPath) {
  if (!storedPath) return null;

  if (isMediaProxyPath(storedPath)) {
    const { get } = require('@vercel/blob');
    const result = await get(mediaPathToBlobPathname(storedPath), {
      access: 'private',
      ...blobAuthOptions(),
    });

    if (!result?.stream) return null;

    const chunks = [];
    for await (const chunk of result.stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  if (isRemoteImage(storedPath)) {
    const response = await fetch(storedPath);
    if (!response.ok) {
      throw new Error('No se pudo leer la imagen del producto original.');
    }
    return Buffer.from(await response.arrayBuffer());
  }

  const fullPath = path.join(publicDir, storedPath.replace(/^\//, ''));
  if (!fullPath.startsWith(productosImagesDir)) {
    throw new Error('Ruta de imagen de producto no válida.');
  }

  try {
    return await fs.promises.readFile(fullPath);
  } catch {
    throw new Error('No se encontró el archivo de imagen del producto original.');
  }
}

function duplicateImageFilename(codigo) {
  const base = String(codigo || 'producto')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/gi, '-')
    .toLowerCase()
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'producto';

  return `${base}-copia-${Date.now()}.webp`;
}

/** Copia física de la imagen para que el duplicado no comparta archivo con el original. */
async function copyStoredProductoImage(storedPath, codigoHint = 'producto') {
  if (!storedPath) return null;

  const buffer = await readStoredProductoImage(storedPath);
  if (!buffer?.length) return null;

  return saveProductoImage(buffer, duplicateImageFilename(codigoHint));
}

async function saveProductoImage(buffer, filename) {
  if (env.isVercel) {
    const { put } = require('@vercel/blob');
    const pathname = `productos/${filename}`;
    let access = resolveBlobAccess();

    try {
      const blob = await put(pathname, buffer, blobPutOptions(access));

      if (access === 'private') {
        return `${MEDIA_PREFIX}${filename}`;
      }

      return blob.url;
    } catch (err) {
      const message = err?.message || String(err);
      const privateStoreConflict = /private store|private access/i.test(message);

      if (access === 'public' && privateStoreConflict) {
        await put(pathname, buffer, blobPutOptions('private'));
        return `${MEDIA_PREFIX}${filename}`;
      }

      throw new Error(
        'No se pudo guardar la imagen en Vercel Blob. '
        + 'Si tu store es privado, añade BLOB_ACCESS=private en Vercel y redeploy. '
        + 'Para fotos de catálogo también puedes crear un Blob store **Public** y reconectarlo. '
        + `(${message})`,
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

  if (isMediaProxyPath(storedPath)) {
    try {
      const { del } = require('@vercel/blob');
      await del(mediaPathToBlobPathname(storedPath), {
        access: 'private',
        ...blobAuthOptions(),
      });
    } catch {
      /* ya eliminada */
    }
    return;
  }

  if (isRemoteImage(storedPath)) {
    try {
      const { del } = require('@vercel/blob');
      await del(storedPath, blobAuthOptions());
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
  MEDIA_PREFIX,
  isRemoteImage,
  isMediaProxyPath,
  mediaPathToBlobPathname,
  duplicateImageFilename,
  readStoredProductoImage,
  copyStoredProductoImage,
  saveProductoImage,
  deleteStoredProductoImage,
  blobAuthOptions,
};
