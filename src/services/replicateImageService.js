const sharp = require('sharp');
const Replicate = require('replicate');
const env = require('../config/env');
const { width: CATALOG_W, height: CATALOG_H } = require('../config/productImage');

/** Real-ESRGAN — super-resolución y mejora de nitidez. */
const ENHANCE_MODEL = 'nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa';
const RATE_LIMIT_RETRY_DELAYS_MS = [4000, 10000, 20000];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(err) {
  const raw = err?.message || String(err);
  return /429|rate limit|too many requests/i.test(raw);
}

function formatReplicateError(err) {
  const raw = err?.message || String(err);

  if (/402|Insufficient credit|insufficient credit/i.test(raw)) {
    return 'Sin créditos en Replicate. Añade saldo en replicate.com/account/billing (aprox. USD 0,0025 por imagen) y espera unos minutos.';
  }
  if (/401|Unauthorized|invalid.*token/i.test(raw)) {
    return 'Token de Replicate inválido. Revisa REPLICATE_API_TOKEN en tu archivo .env.';
  }
  if (/422|Invalid version|not permitted to run/i.test(raw)) {
    return 'El modelo de IA no está disponible ahora. Intenta de nuevo en unos minutos.';
  }
  if (isRateLimitError(raw)) {
    return 'Replicate limitó las solicitudes (demasiados intentos seguidos). Espera 30–60 segundos y pulsa Mejorar IA una sola vez.';
  }
  if (/Prediction failed:/i.test(raw)) {
    return raw.replace(/^Prediction failed:\s*/i, 'Replicate: ');
  }
  if (/^La API de Replicate|^Replicate no|^No se pudo descargar|^La IA no/i.test(raw)) {
    return raw;
  }

  return `No se pudo mejorar la imagen con IA: ${raw}`;
}

function resolveOutputUrl(output) {
  if (!output) return null;
  if (typeof output === 'string') return output;
  if (Array.isArray(output)) return resolveOutputUrl(output[0]);
  if (typeof output.toString === 'function' && output.toString() !== '[object Object]') {
    const asString = output.toString();
    if (asString.startsWith('http')) return asString;
  }
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
    throw new Error('No se pudo descargar la imagen mejorada.');
  }

  const contentType = response.headers.get('content-type') || 'image/png';
  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    mimeType: contentType.split(';')[0],
  };
}

async function runEnhanceModel(replicate, input) {
  let lastErr;

  for (let attempt = 0; attempt <= RATE_LIMIT_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await replicate.run(ENHANCE_MODEL, { input });
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

async function finalizeForCatalog(rawBuffer, inputMeta) {
  const upscaledMeta = await sharp(rawBuffer).rotate().metadata();

  const enhancedBuffer = await sharp(rawBuffer)
    .rotate()
    .resize(CATALOG_W, CATALOG_H, {
      fit: 'cover',
      position: 'centre',
      kernel: sharp.kernel.lanczos3,
    })
    .sharpen({ sigma: 1.2, m1: 0.8, m2: 2 })
    .png()
    .toBuffer();

  return {
    buffer: enhancedBuffer,
    mimeType: 'image/png',
    width: CATALOG_W,
    height: CATALOG_H,
    upscaledWidth: upscaledMeta.width,
    upscaledHeight: upscaledMeta.height,
    inputWidth: inputMeta.width,
    inputHeight: inputMeta.height,
  };
}

async function enhanceImage(filePath) {
  if (!env.replicateApiToken) {
    throw new Error('La API de Replicate no está configurada. Añade REPLICATE_API_TOKEN en .env y reinicia el servidor.');
  }

  const inputMeta = await sharp(filePath).rotate().metadata();
  const inputBuffer = await sharp(filePath)
    .rotate()
    .resize(CATALOG_W, CATALOG_H, { fit: 'inside', withoutEnlargement: true })
    .png()
    .toBuffer();
  const dataUri = `data:image/png;base64,${inputBuffer.toString('base64')}`;

  const replicate = new Replicate({ auth: env.replicateApiToken });

  let output;
  try {
    output = await runEnhanceModel(replicate, {
      image: dataUri,
      scale: 2,
      face_enhance: false,
    });
  } catch (err) {
    console.error('[replicateImageService] Error al llamar Real-ESRGAN:', err?.message || err);
    throw new Error(formatReplicateError(err));
  }

  try {
    const { buffer: rawBuffer } = await readReplicateOutput(output);
    return finalizeForCatalog(rawBuffer, inputMeta);
  } catch (err) {
    console.error('[replicateImageService] Error al procesar respuesta:', err?.message || err);
    throw err instanceof Error ? err : new Error(String(err));
  }
}

module.exports = { enhanceImage };
