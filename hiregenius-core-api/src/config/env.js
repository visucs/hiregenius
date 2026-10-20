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
  CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS || process.env.FRONTEND_BASE_URL || 'https://hiregenius-delta.vercel.app,http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://localhost:3000',
  AI_ML_SERVICE_URL: process.env.AI_ML_SERVICE_URL || 'http://localhost:8000',
  AI_ML_SERVICE_INTERNAL_KEY: process.env.AI_ML_SERVICE_INTERNAL_KEY || 'hg_internal_dev_secret_key_2026',
};

if (!env.JWT_SIGNING_KEY) {
  throw new Error('FATAL: JWT_SIGNING_KEY environment variable is missing.');
}

if (env.NODE_ENV === 'production' && !process.env.AI_ML_SERVICE_INTERNAL_KEY) {
  throw new Error('FATAL: AI_ML_SERVICE_INTERNAL_KEY environment variable is required in production.');
}

if (env.NODE_ENV === 'production') {
  const missingDbVars = [];
  if (!process.env.DB_HOST) missingDbVars.push('DB_HOST');
  if (!process.env.DB_USER) missingDbVars.push('DB_USER');
  if (!process.env.DB_PASSWORD) missingDbVars.push('DB_PASSWORD');
  if (!process.env.DB_NAME) missingDbVars.push('DB_NAME');

  if (missingDbVars.length > 0) {
    throw new Error(`FATAL: Missing required database environment variables in production: ${missingDbVars.join(', ')}`);
  }
}

if (env.NODE_ENV === 'production' && (!env.MAIL_USERNAME || !env.MAIL_PASSWORD)) {
  throw new Error('FATAL: MAIL_USERNAME and MAIL_PASSWORD environment variables are required in production.');
} else if (!env.MAIL_USERNAME || !env.MAIL_PASSWORD) {
  if (env.NODE_ENV !== 'test') {
    console.warn('[EmailConfig] WARNING: MAIL_USERNAME or MAIL_PASSWORD is not set. Outgoing emails will be logged but cannot be delivered via SMTP.');
  }
}

module.exports = env;

