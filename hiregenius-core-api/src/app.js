const express = require('express');
const cors = require('cors');
const jobsRouter = require('./modules/jobs/jobs.routes');
const candidatesRouter = require('./modules/candidates/candidates.routes');
const applicationsRouter = require('./modules/applications/applications.routes');
const interviewsRouter = require('./modules/interviews/interviews.routes');
const notificationsRouter = require('./modules/notifications/notifications.routes');
const recruiterPreferencesRouter = require('./modules/recruiters/recruiterPreferences.routes');
const analyticsRouter = require('./modules/analytics/analytics.routes');
const settingsRouter = require('./modules/admin/settings/settings.routes');
const adminHealthRouter = require('./modules/admin/health/health.routes');
const adminUsersRouter = require('./modules/admin/users/users.routes');
const maintenanceMode = require('./middleware/maintenanceMode');
const errorHandler = require('./middleware/errorHandler');
const db = require('./config/db');
const env = require('./config/env');
const ApiError = require('./utils/ApiError');
const { swaggerUi, swaggerSpec, isSwaggerEnabled } = require('./config/swagger');

const app = express();

// Configured CORS middleware
const allowedOrigins = (env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes('*') ||
        (env.NODE_ENV !== 'production' && (origin.includes('localhost') || origin.includes('127.0.0.1')))
      ) {
        return callback(null, true);
      }
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database-aware Health Check (both /health and /api/health)
const healthCheckHandler = async (req, res) => {
  try {
    await db.raw('SELECT 1 AS health_check');
    return res.status(200).json({
      status: 'UP',
      database: 'CONNECTED',
      service: 'hiregenius-core-api',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(503).json({
      status: 'DOWN',
      database: 'DISCONNECTED',
      error: err.message,
      service: 'hiregenius-core-api',
      timestamp: new Date().toISOString(),
    });
  }
};

app.get('/health', healthCheckHandler);
app.get('/api/health', healthCheckHandler);
app.healthCheckHandler = healthCheckHandler;

// Swagger OpenAPI documentation
if (isSwaggerEnabled) {
  // Raw OpenAPI 3.0.0 JSON specification
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Convenient redirects
  app.get('/api-docs', (req, res) => res.redirect('/swagger-ui/index.html'));
  app.get('/swagger-ui', (req, res) => res.redirect('/swagger-ui/index.html'));

  // Swagger UI
  app.use(
    '/swagger-ui',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'HireGenius Core API Docs',
      swaggerOptions: {
        persistAuthorization: true,
      },
    })
  );
}

// Global maintenance mode guard (respects admin access, health, docs)
app.use(maintenanceMode);

// Mount module routes
app.use('/api/jobs', jobsRouter);
app.use('/api/jobs', applicationsRouter.jobsApplicationsRouter);
app.use('/api/candidates', candidatesRouter);
app.use('/api/candidates', interviewsRouter.candidatesInterviewsRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/interviews', interviewsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/recruiters', recruiterPreferencesRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/admin/settings', settingsRouter);
app.use('/api/admin/health', adminHealthRouter);
app.use('/api/admin/users', adminUsersRouter);

// 404 handler for unknown routes
app.use((req, res, next) => {
  next(ApiError.notFound(`Endpoint ${req.method} ${req.originalUrl} not found`));
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
