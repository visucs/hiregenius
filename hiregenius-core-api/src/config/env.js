const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  JWT_SIGNING_KEY: process.env.JWT_SIGNING_KEY,
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '3306', 10),
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || 'supersecret',
  DB_NAME: process.env.DB_NAME || 'hiregenius',
  DB_SSL: process.env.DB_SSL === 'true',
  DB_POOL_MIN: parseInt(process.env.DB_POOL_MIN || '1', 10),
  DB_POOL_MAX: parseInt(process.env.DB_POOL_MAX || '10', 10),
  ENABLE_SWAGGER: process.env.ENABLE_SWAGGER !== 'false',
};

if (!env.JWT_SIGNING_KEY) {
  throw new Error('FATAL: JWT_SIGNING_KEY environment variable is missing.');
}

module.exports = env;
