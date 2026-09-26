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
  MAIL_HOST: process.env.MAIL_HOST || 'smtp.gmail.com',
  MAIL_PORT: parseInt(process.env.MAIL_PORT || '587', 10),
  MAIL_USERNAME: process.env.MAIL_USERNAME || '',
  MAIL_PASSWORD: process.env.MAIL_PASSWORD || '',
  MAIL_FROM: process.env.MAIL_FROM || 'noreply@hiregenius.ai',
  FRONTEND_BASE_URL: process.env.FRONTEND_BASE_URL || 'https://hiregenius-delta.vercel.app',
  CORE_API_URL: process.env.CORE_API_URL || 'http://localhost:4000',
};

if (!env.JWT_SIGNING_KEY) {
  throw new Error('FATAL: JWT_SIGNING_KEY environment variable is missing.');
}

if (env.NODE_ENV === 'production' && (!env.MAIL_USERNAME || !env.MAIL_PASSWORD)) {
  throw new Error('FATAL: MAIL_USERNAME and MAIL_PASSWORD environment variables are required in production.');
} else if (!env.MAIL_USERNAME || !env.MAIL_PASSWORD) {
  if (env.NODE_ENV !== 'test') {
    console.warn('[EmailConfig] WARNING: MAIL_USERNAME or MAIL_PASSWORD is not set. Outgoing emails will be logged but cannot be delivered via SMTP.');
  }
}

module.exports = env;
