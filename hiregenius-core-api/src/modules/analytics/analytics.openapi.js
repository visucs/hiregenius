const { z } = require('zod');
const { apiErrorSchema, apiSuccessEnvelopeSchema } = require('../jobs/jobs.validation');

function registerAnalyticsOpenApi(registry) {
  // 1. GET /api/analytics/recruiter/summary
  registry.registerPath({
    method: 'get',
    path: '/api/analytics/recruiter/summary',
    summary: 'Recruiter analytics summary',
    description: 'Returns job, application, and interview metrics scoped to the authenticated recruiter.\n\n**Required Role:** RECRUITER',
    tags: ['Analytics'],
    security: [{ bearerAuth: [] }],
    request: {
      query: z.object({
        days: z.coerce.number().int().positive().optional().openapi({ example: 30 }),
      }),
    },
    responses: {
      200: {
        description: 'Recruiter analytics summary retrieved successfully',
        content: {
          'application/json': {
            schema: apiSuccessEnvelopeSchema(z.object({}), 'Recruiter analytics summary retrieved successfully'),
          },
        },
      },
      400: {
        description: 'Invalid query parameters',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
      401: {
        description: 'Unauthorized',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
      403: {
        description: 'Forbidden - Recruiter role required',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
    },
  });

  // 2. GET /api/analytics/recruiter/jobs-breakdown
  registry.registerPath({
    method: 'get',
    path: '/api/analytics/recruiter/jobs-breakdown',
    summary: 'Recruiter jobs breakdown',
    description: 'Returns per-job metrics (application and interview counts) for the recruiter’s jobs, ordered by application count.\n\n**Required Role:** RECRUITER',
    tags: ['Analytics'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Recruiter jobs breakdown retrieved successfully',
        content: {
          'application/json': {
            schema: apiSuccessEnvelopeSchema(z.array(z.object({})), 'Recruiter jobs breakdown retrieved successfully'),
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
      403: {
        description: 'Forbidden - Recruiter role required',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
    },
  });

  // 3. GET /api/analytics/recruiter/trend
  registry.registerPath({
    method: 'get',
    path: '/api/analytics/recruiter/trend',
    summary: 'Recruiter application daily trend',
    description: 'Returns continuous daily application counts over the specified window (default 30 days) with zero-filled gaps.\n\n**Required Role:** RECRUITER',
    tags: ['Analytics'],
    security: [{ bearerAuth: [] }],
    request: {
      query: z.object({
        days: z.coerce.number().int().positive().optional().openapi({ example: 30 }),
      }),
    },
    responses: {
      200: {
        description: 'Recruiter application trend retrieved successfully',
        content: {
          'application/json': {
            schema: apiSuccessEnvelopeSchema(z.array(z.object({})), 'Recruiter application trend retrieved successfully'),
          },
        },
      },
      400: {
        description: 'Invalid days parameter',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
      401: {
        description: 'Unauthorized',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
      403: {
        description: 'Forbidden - Recruiter role required',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
    },
  });

  // 4. GET /api/analytics/candidate/summary
  registry.registerPath({
    method: 'get',
    path: '/api/analytics/candidate/summary',
    summary: 'Candidate analytics summary',
    description: 'Returns application status breakdown and interview metrics scoped to the authenticated candidate.\n\n**Required Role:** CANDIDATE',
    tags: ['Analytics'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Candidate analytics summary retrieved successfully',
        content: {
          'application/json': {
            schema: apiSuccessEnvelopeSchema(z.object({}), 'Candidate analytics summary retrieved successfully'),
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
      403: {
        description: 'Forbidden - Candidate role required',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
    },
  });

  // 5. GET /api/analytics/admin/summary
  registry.registerPath({
    method: 'get',
    path: '/api/analytics/admin/summary',
    summary: 'Platform-wide admin analytics summary',
    description: 'Returns platform-wide totals for users by role, jobs, applications, and interviews.\n\n**Required Role:** ADMIN',
    tags: ['Analytics'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Platform-wide admin analytics summary retrieved successfully',
        content: {
          'application/json': {
            schema: apiSuccessEnvelopeSchema(z.object({}), 'Platform-wide admin analytics summary retrieved successfully'),
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
      403: {
        description: 'Forbidden - Admin role required',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
    },
  });

  // 6. GET /api/analytics/admin/top-recruiters
  registry.registerPath({
    method: 'get',
    path: '/api/analytics/admin/top-recruiters',
    summary: 'Admin top recruiters leaderboard',
    description: 'Returns top recruiters ranked by applications received or jobs posted.\n\n**Required Role:** ADMIN',
    tags: ['Analytics'],
    security: [{ bearerAuth: [] }],
    request: {
      query: z.object({
        limit: z.coerce.number().int().positive().optional().openapi({ example: 10 }),
        sortBy: z.enum(['applications', 'jobs']).optional().openapi({ example: 'applications' }),
      }),
    },
    responses: {
      200: {
        description: 'Top recruiters retrieved successfully',
        content: {
          'application/json': {
            schema: apiSuccessEnvelopeSchema(z.array(z.object({})), 'Top recruiters retrieved successfully'),
          },
        },
      },
      400: {
        description: 'Invalid query parameters',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
      401: {
        description: 'Unauthorized',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
      403: {
        description: 'Forbidden - Admin role required',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
    },
  });
}

module.exports = {
  registerAnalyticsOpenApi,
};
