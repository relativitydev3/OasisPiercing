const { neon } = require('@neondatabase/serverless');
const { Pool } = require('pg');
const env = require('./env');

if (!env.databaseUrl) {
  console.warn('[database] DATABASE_URL no está configurada.');
}

const sql = env.databaseUrl ? neon(env.databaseUrl) : null;

const pool = env.databaseUrl
  ? new Pool({
      connectionString: env.databaseUrl,
      ssl: env.databaseUrl.includes('localhost')
        ? false
        : { rejectUnauthorized: false },
    })
  : null;

if (pool) {
  pool.on('error', (err) => {
    console.error('[database] Error en el pool de conexiones:', err.message || err);
  });
}

module.exports = { sql, pool };
