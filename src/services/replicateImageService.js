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

async function finalizeForCatalog(rawBuffer, inputMeta, { skipResize = false } = {}) {
  const upscaledMeta = await sharp(rawBuffer).rotate().metadata();

  let pipeline = sharp(rawBuffer).rotate();
  if (!skipResize) {
    pipeline = pipeline.resize(CATALOG_W, CATALOG_H, {
      fit: 'cover',
      position: 'centre',
      kernel: sharp.kernel.lanczos3,
    });
  }
  const enhancedBuffer = await pipeline
    .sharpen({ sigma: 1.2, m1: 0.8, m2: 2 })
    .png()
    .toBuffer();

  const outMeta = await sharp(enhancedBuffer).metadata();

  return {
    buffer: enhancedBuffer,
    mimeType: 'image/png',
    width: outMeta.width || CATALOG_W,
    height: outMeta.height || CATALOG_H,
    upscaledWidth: upscaledMeta.width,
    upscaledHeight: upscaledMeta.height,
    inputWidth: inputMeta.width,
    inputHeight: inputMeta.height,
  };
}

async function enhanceImage(source, options = {}) {
  const mode = options.mode || 'full';
  if (!env.replicateApiToken) {
    throw new Error('La API de Replicate no está configurada. Añade REPLICATE_API_TOKEN en .env y reinicia el servidor.');
  }

  const inputBuffer = Buffer.isBuffer(source)
    ? source
    : await sharp(source).rotate().png().toBuffer();

  const inputMeta = await sharp(inputBuffer).metadata();
  const dataUri = `data:image/png;base64,${inputBuffer.toString('base64')}`;

  const replicate = new Replicate({ auth: env.replicateApiToken });

  let output;
  const scale = mode === 'sharpen' ? 1 : 2;
  try {
    output = await runEnhanceModel(replicate, {
      image: dataUri,
      scale,
      face_enhance: false,
    });
  } catch (err) {
    console.error('[replicateImageService] Error al llamar Real-ESRGAN:', err?.message || err);
    throw new Error(formatReplicateError(err));
  }

  try {
    const { buffer: rawBuffer } = await readReplicateOutput(output);
    if (mode === 'sharpen') {
      const sharpened = await sharp(rawBuffer)
        .rotate()
        .sharpen({ sigma: 1.4, m1: 1, m2: 2.5 })
        .png()
        .toBuffer();
      const meta = await sharp(sharpened).metadata();
      return {
        buffer: sharpened,
        mimeType: 'image/png',
        width: meta.width,
        height: meta.height,
        upscaledWidth: meta.width,
        upscaledHeight: meta.height,
        inputWidth: inputMeta.width,
        inputHeight: inputMeta.height,
      };
    }
    if (mode === 'upscale') {
      return finalizeForCatalog(rawBuffer, inputMeta, { skipResize: true });
    }
    return finalizeForCatalog(rawBuffer, inputMeta);
  } catch (err) {
    console.error('[replicateImageService] Error al procesar respuesta:', err?.message || err);
    throw err instanceof Error ? err : new Error(String(err));
  }
}

/** Fondo 1200×800 para compositar en el editor (gradiente premium; ampliable con IA externa). */
async function generateCatalogBackground(style = 'cream') {
  const palettes = {
    cream: { from: '#fffbf3', to: '#f3ead8' },
    gold: { from: '#f3ead8', to: '#d4a853' },
    dark: { from: '#2a2a32', to: '#08080a' },
    sage: { from: '#eef5ee', to: '#c5d4c5' },
  };
  const colors = palettes[style] || palettes.cream;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CATALOG_W}" height="${CATALOG_H}">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${colors.from}"/>
        <stop offset="100%" stop-color="${colors.to}"/>
      </linearGradient>
      <radialGradient id="v" cx="50%" cy="45%" r="65%">
        <stop offset="0%" stop-color="rgba(255,255,255,0.35)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0.08)"/>
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <rect width="100%" height="100%" fill="url(#v)"/>
  </svg>`;

  const buffer = await sharp(Buffer.from(svg))
    .png()
    .toBuffer();

  return {
    buffer,
    mimeType: 'image/png',
    width: CATALOG_W,
    height: CATALOG_H,
  };
}

module.exports = { enhanceImage, generateCatalogBackground };
