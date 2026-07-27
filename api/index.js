const { validateEnv } = require('../src/config/env');

try {
  validateEnv();
} catch (err) {
  console.error('[vercel] Configuración inválida:', err.message);
  console.error('[vercel] Define DATABASE_URL y SESSION_SECRET (≥32 chars) en Vercel → Settings → Environment Variables.');
  throw err;
}

module.exports = require('../src/app');
