const app = require('./app');
const env = require('./config/env');
const db = require('./config/db');

async function startServer() {
  try {
    // Verify database connectivity
    await db.raw('SELECT 1+1 AS result');
    console.log(`[Database] MySQL connected successfully at ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`);

    // Auto-run pending migrations
    console.log('[Database] Checking Knex migrations...');
    await db.migrate.latest();
    console.log('[Database] Migrations are up to date.');

    const server = app.listen(env.PORT, () => {
      console.log(`[Core API] HireGenius Core API running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });

    const shutdown = async (signal) => {
      console.log(`\n[Core API] Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        try {
          await db.destroy();
          console.log('[Core API] Database connections closed. Process terminating cleanly.');
          process.exit(0);
        } catch (err) {
          console.error('[Core API] Error closing database connections:', err);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('[Core API] Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
