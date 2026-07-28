const fs = require('fs');
const env = require('../config/env');

const REMOVEBG_URL = 'https://api.remove.bg/v1.0/removebg';

async function removeBackground(source) {
  const apiKey = env.removeBgApiKey;
  if (!apiKey) {
    throw new Error('La API de remove.bg no está configurada. Añade REMOVEBG_API_KEY en el archivo .env y reinicia el servidor.');
  }

  const imageBuffer = Buffer.isBuffer(source) ? source : fs.readFileSync(source);
  const form = new FormData();
  form.append('image_file', new Blob([imageBuffer]), 'producto.png');
  form.append('size', 'auto');
  form.append('bg_color', '08080a');
  form.append('format', 'png');

  const response = await fetch(REMOVEBG_URL, {
    method: 'POST',
    headers: { 'X-Api-Key': apiKey },
    body: form,
  });

  if (!response.ok) {
    let message = 'No se pudo quitar el fondo.';
    try {
      const data = await response.json();
      message = data.errors?.[0]?.title || data.error?.message || message;
    } catch {
      /* respuesta no JSON */
    }
    throw new Error(message);
  }

  return Buffer.from(await response.arrayBuffer());
}

module.exports = { removeBackground };
