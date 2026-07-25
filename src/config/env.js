require('dotenv').config();

function resolveAppUrl() {
  if (process.env.APP_URL) return process.env.APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}/`;
  return `http://localhost:${process.env.PORT || 3000}/`;
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  appUrl: resolveAppUrl(),
};

module.exports = env;
