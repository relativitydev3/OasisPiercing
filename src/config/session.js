const session = require('express-session');
const connectPgSimple = require('connect-pg-simple');
const env = require('./env');
const { pool } = require('./database');

const PgSession = connectPgSimple(session);

function createSessionMiddleware() {
  let store;

  if (pool) {
    store = new PgSession({
      pool,
      tableName: 'session',
      createTableIfMissing: true,
    });
  } else if (env.nodeEnv === 'production') {
    throw new Error('DATABASE_URL es requerida para las sesiones en producción.');
  }

  return session({
    store,
    name: 'oasis.sid',
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    proxy: true,
    cookie: {
      secure: env.nodeEnv === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  });
}

module.exports = { createSessionMiddleware };
