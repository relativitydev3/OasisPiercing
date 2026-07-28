require('dotenv').config();

const DEFAULT_SESSION_SECRET = 'oasis-dev-secret-cambiar-en-produccion';

function resolveAppUrl() {
  if (process.env.APP_URL) return process.env.APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}/`;
  return `http://localhost:${process.env.PORT || 3000}/`;
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  appUrl: resolveAppUrl(),
  databaseUrl:
    process.env.DATABASE_URL
    || process.env.POSTGRES_URL
    || process.env.NEON_DATABASE_URL
    || '',
  sessionSecret: process.env.SESSION_SECRET || DEFAULT_SESSION_SECRET,
  removeBgApiKey: (process.env.REMOVEBG_API_KEY || '').trim(),
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
};

function validateEnv() {
  if (!env.isProduction) return;

  if (!env.databaseUrl) {
    throw new Error('DATABASE_URL es obligatoria en producción.');
  }

  if (!process.env.SESSION_SECRET || env.sessionSecret === DEFAULT_SESSION_SECRET) {
    throw new Error('SESSION_SECRET debe estar definida con un valor seguro en producción.');
  }

  if (env.sessionSecret.length < 32) {
    throw new Error('SESSION_SECRET debe tener al menos 32 caracteres en producción.');
  }
}

module.exports = env;
module.exports.validateEnv = validateEnv;
module.exports.DEFAULT_SESSION_SECRET = DEFAULT_SESSION_SECRET;
