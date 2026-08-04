/**
 * Prueba Vercel Blob con el mismo token que la app (.env → BLOB_READ_WRITE_TOKEN).
 * Uso: node scripts/test-blob.js
 */
require('../src/config/env');

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    console.error('Falta BLOB_READ_WRITE_TOKEN en .env');
    process.exit(1);
  }

  const { put } = require('@vercel/blob');
  const pathname = `productos/test-oasis-${Date.now()}.txt`;

  try {
    const blob = await put(pathname, 'Oasis Piercing — prueba Blob OK', {
      access: 'public',
      token,
      addRandomSuffix: false,
    });
    console.log('Blob subido correctamente');
    console.log('URL:', blob.url);
    console.log('Pathname:', pathname);
  } catch (err) {
    console.error('Error:', err.message);
    process.exitCode = 1;
  }
}

main();
