const { OpenAPIRegistry, OpenApiGeneratorV3 } = require('@asteasolutions/zod-to-openapi');
const swaggerUi = require('swagger-ui-express');
const env = require('./env');
const { registerJobsOpenApi } = require('../modules/jobs/jobs.openapi');

const registry = new OpenAPIRegistry();

// Register Bearer Auth Security Scheme
registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Enter your JWT token obtained from Auth Service (/api/auth/login or /auth/google-login)',
});

// Register Module Endpoints
registerJobsOpenApi(registry);
const { registerCandidatesOpenApi } = require('../modules/candidates/candidates.openapi');
registerCandidatesOpenApi(registry);
const { registerApplicationsOpenApi } = require('../modules/applications/applications.openapi');
registerApplicationsOpenApi(registry);
// const { registerInterviewsOpenApi } = require('../modules/interviews/interviews.openapi');
// registerInterviewsOpenApi(registry);
// const { registerAnalyticsOpenApi } = require('../modules/analytics/analytics.openapi');
// registerAnalyticsOpenApi(registry);

const generator = new OpenApiGeneratorV3(registry.definitions);

const swaggerSpec = generator.generateDocument({
  openapi: '3.0.0',
  info: {
    title: 'HireGenius Core API',
    version: '1.0.0',
    description:
      'Core REST API for HireGenius AI platform. Manages Jobs, Candidates, Applications, Interviews, and Analytics. Authenticated via shared HS256 JWT issued by the Auth Service.',
    contact: {
      name: 'HireGenius Engineering',
    },
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}`,
      description: 'Local Development Server',
    },
  ],
  tags: [
    { name: 'Jobs', description: 'Job postings management, public listings, and recruiter dashboard' },
    { name: 'Candidates', description: 'Candidate profile and resume management (Upcoming)' },
    { name: 'Applications', description: 'Application workflow and status tracking (Upcoming)' },
    { name: 'Interviews', description: 'AI interview scheduling and scoring (Upcoming)' },
    { name: 'Analytics', description: 'Recruitment metrics and hiring funnel insights (Upcoming)' },
  ],
});

module.exports = {
  swaggerUi,
  swaggerSpec,
  isSwaggerEnabled: env.ENABLE_SWAGGER,
};
