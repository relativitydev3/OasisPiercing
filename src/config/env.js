require('dotenv').config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  appUrl: process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}/`,
};

module.exports = env;
