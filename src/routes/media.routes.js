const express = require('express');
const path = require('path');
const env = require('../config/env');
const {
  MEDIA_PREFIX,
  mediaPathToBlobPathname,
  blobAuthOptions,
} = require('../utils/productImageStorage');

const router = express.Router();

router.get(`${MEDIA_PREFIX}:filename`, async (req, res, next) => {
  if (!env.isVercel) {
    return res.status(404).send('Not found');
  }

  const filename = path.basename(req.params.filename || '');
  if (!filename || filename.includes('..')) {
    return res.status(400).send('Nombre de archivo inválido.');
  }

  try {
    const { get } = require('@vercel/blob');
    const result = await get(mediaPathToBlobPathname(`${MEDIA_PREFIX}${filename}`), {
      access: 'private',
      ...blobAuthOptions(),
    });

    res.set('Content-Type', result.blob.contentType || 'image/webp');
    res.set('Cache-Control', 'public, max-age=604800, immutable');

    if (result.stream?.pipe) {
      result.stream.pipe(res);
      return;
    }

    res.status(404).send('Imagen no encontrada.');
  } catch (err) {
    if (/not found|404/i.test(err?.message || '')) {
      return res.status(404).send('Imagen no encontrada.');
    }
    next(err);
  }
});

module.exports = router;
