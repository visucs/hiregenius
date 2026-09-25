const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });

module.exports = {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'supersecret',
      database: process.env.DB_NAME || 'hiregenius',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    },
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '1', 10),
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    },
    migrations: {
      directory: path.resolve(__dirname, 'migrations'),
      tableName: 'knex_migrations',
    },
  },

  test: {
    client: process.env.DB_CLIENT || (process.env.USE_SQLITE === 'true' ? 'sqlite3' : 'mysql2'),
    connection: process.env.USE_SQLITE === 'true'
      ? { filename: ':memory:' }
      : {
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '3306', 10),
          user: process.env.DB_USER || 'root',
          password: process.env.DB_PASSWORD || 'supersecret',
          database: process.env.DB_NAME || 'hiregenius',
        },
    useNullAsDefault: true,
    pool: { min: 1, max: 5 },
    migrations: {
      directory: path.resolve(__dirname, 'migrations'),
      tableName: 'knex_migrations',
    },
  },

  production: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    },
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    },
    migrations: {
      directory: path.resolve(__dirname, 'migrations'),
      tableName: 'knex_migrations',
    },
  },
};
