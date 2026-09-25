const express = require('express');
const cors = require('cors');
const jobsRouter = require('./modules/jobs/jobs.routes');
const candidatesRouter = require('./modules/candidates/candidates.routes');
const applicationsRouter = require('./modules/applications/applications.routes');
const errorHandler = require('./middleware/errorHandler');
const ApiError = require('./utils/ApiError');
const { swaggerUi, swaggerSpec, isSwaggerEnabled } = require('./config/swagger');

const app = express();

// Standard middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'hiregenius-core-api',
    timestamp: new Date().toISOString(),
  });
});

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

// Mount module routes
app.use('/api/jobs', jobsRouter);
app.use('/api/jobs', applicationsRouter.jobsApplicationsRouter);
app.use('/api/candidates', candidatesRouter);
app.use('/api/applications', applicationsRouter);

// 404 handler for unknown routes
app.use((req, res, next) => {
  next(ApiError.notFound(`Endpoint ${req.method} ${req.originalUrl} not found`));
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
