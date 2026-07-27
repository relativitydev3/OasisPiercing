const { sql } = require('../config/database');
const { AppError } = require('./errors');

function requireDb() {
  if (!sql) {
    throw new AppError(
      'Base de datos no configurada. Revisa DATABASE_URL en tu archivo .env (connection string de Neon).',
      503,
    );
  }
  return sql;
}

module.exports = { requireDb };
