const sharp = require('sharp');
const Replicate = require('replicate');
const env = require('../config/env');

/** LaMa — inpainting por máscara (blanco = zona a rellenar / quitar). Versión fija (sin hash → 404 en API). */
const LAMA_MODEL =
  'twn39/lama:2b91ca2340801c2a5be745612356fac36a17f698354a07f48a62d564d3b3a7a0';
const RATE_LIMIT_RETRY_DELAYS_MS = [4000, 10000, 20000];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(err) {
  const raw = err?.message || String(err);
  return /429|rate limit|too many requests/i.test(raw);
}

function formatInpaintError(err) {
  const raw = err?.message || String(err);

  if (/402|Insufficient credit|insufficient credit/i.test(raw)) {
    return 'Sin créditos en Replicate. Añade saldo en replicate.com/account/billing.';
  }
  if (/401|Unauthorized|invalid.*token/i.test(raw)) {
    return 'Token de Replicate inválido. Revisa REPLICATE_API_TOKEN en tu archivo .env.';
  }
  if (isRateLimitError(raw)) {
    return 'Replicate limitó las solicitudes. Espera unos segundos e intenta de nuevo.';
  }
  if (/404|not found|could not be found/i.test(raw)) {
    return 'El modelo LaMa no está disponible en Replicate. Actualiza el servidor o contacta soporte.';
  }
  if (/Prediction failed:/i.test(raw)) {
    return raw.replace(/^Prediction failed:\s*/i, 'Replicate: ');
  }

  return err.message || 'No se pudo quitar el objeto con IA.';
}

function resolveOutputUrl(output) {
  if (!output) return null;
  if (typeof output === 'string') return output;
  if (Array.isArray(output)) return resolveOutputUrl(output[0]);
  if (typeof output.url === 'function') return String(output.url());
  return null;
}

async function readReplicateOutput(output) {
  const item = Array.isArray(output) ? output[0] : output;

  if (item && typeof item.blob === 'function') {
    const blob = await item.blob();
    const arrayBuffer = await blob.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuffer),
      mimeType: (blob.type || 'image/png').split(';')[0],
    };
  }

  const resultUrl = resolveOutputUrl(output);
  if (!resultUrl) {
    throw new Error('Replicate no devolvió una imagen válida.');
  }

  const response = await fetch(resultUrl);
  if (!response.ok) {
    throw new Error('No se pudo descargar la imagen procesada.');
  }

  const contentType = response.headers.get('content-type') || 'image/png';
  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    mimeType: contentType.split(';')[0],
  };
}

async function runLama(replicate, imageBuffer, maskBuffer) {
  const imageMeta = await sharp(imageBuffer).rotate().metadata();
  let maskPipeline = sharp(maskBuffer).rotate().greyscale();

  if (imageMeta.width && imageMeta.height) {
    maskPipeline = maskPipeline.resize(imageMeta.width, imageMeta.height, { fit: 'fill' });
  }

  const maskNormalized = await maskPipeline.threshold(128).png().toBuffer();

  const imagePng = await sharp(imageBuffer).rotate().ensureAlpha().png().toBuffer();
  const imageUri = `data:image/png;base64,${imagePng.toString('base64')}`;
  const maskUri = `data:image/png;base64,${maskNormalized.toString('base64')}`;

  let lastErr;
  for (let attempt = 0; attempt <= RATE_LIMIT_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await replicate.run(LAMA_MODEL, {
        input: { image: imageUri, mask: maskUri },
      });
    } catch (err) {
      lastErr = err;
      if (!isRateLimitError(err) || attempt >= RATE_LIMIT_RETRY_DELAYS_MS.length) {
        throw err;
      }
      await sleep(RATE_LIMIT_RETRY_DELAYS_MS[attempt]);
    }
  }

  throw lastErr;
}

async function inpaintWithMask(imageBuffer, maskBuffer) {
  if (!env.replicateApiToken) {
    throw new Error('La API de Replicate no está configurada. Añade REPLICATE_API_TOKEN en .env y reinicia el servidor.');
  }

  const replicate = new Replicate({ auth: env.replicateApiToken });

  let output;
  try {
    output = await runLama(replicate, imageBuffer, maskBuffer);
  } catch (err) {
    console.error('[replicateInpaintService] LaMa error:', err?.message || err);
    throw new Error(formatInpaintError(err));
  }

  const { buffer: rawBuffer } = await readReplicateOutput(output);
  const outBuffer = await sharp(rawBuffer).rotate().ensureAlpha().png().toBuffer();
  const meta = await sharp(outBuffer).metadata();

  return {
    buffer: outBuffer,
    mimeType: 'image/png',
    width: meta.width,
    height: meta.height,
  };
}

module.exports = { inpaintWithMask };
