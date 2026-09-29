const { z } = require('zod');
const {
  createJobSchema,
  updateJobSchema,
  updateStatusSchema,
  jobEntitySchema,
  paginatedJobsSchema,
  apiErrorSchema,
  apiSuccessEnvelopeSchema,
} = require('./jobs.validation');

/**
 * Registers all Jobs module endpoints into the central OpenAPI registry.
 *
 * @param {import('@asteasolutions/zod-to-openapi').OpenAPIRegistry} registry
 */
function registerJobsOpenApi(registry) {
  // 1. GET /api/jobs (Public List)
  registry.registerPath({
    method: 'get',
    path: '/api/jobs',
    summary: 'List open jobs (Public)',
    description:
      'Retrieves a paginated list of OPEN job postings. Closed or soft-deleted jobs are never returned. Supports filtering by title, company, and location.\n\n**Required Role:** None (Public endpoint).',
    tags: ['Jobs'],
    request: {
      query: z.object({
        page: z.coerce.number().int().positive().default(1).optional().openapi({
          description: 'Page number for pagination',
          example: 1,
        }),
        limit: z.coerce.number().int().positive().max(100).default(10).optional().openapi({
          description: 'Maximum jobs per page (max 100)',
          example: 10,
        }),
        title: z.string().optional().openapi({
          description: 'Search filter for job title (partial match)',
          example: 'Engineer',
        }),
        company: z.string().optional().openapi({
          description: 'Search filter for company name (partial match)',
          example: 'Acme',
        }),
        location: z.string().optional().openapi({
          description: 'Search filter for location (partial match)',
          example: 'Remote',
        }),
      }),
    },
    responses: {
      200: {
        description: 'Jobs retrieved successfully',
        content: {
          'application/json': {
            schema: apiSuccessEnvelopeSchema(paginatedJobsSchema, 'Jobs retrieved successfully'),
          },
        },
      },
      400: {
        description: 'Invalid query parameters',
        content: {
          'application/json': {
            schema: apiErrorSchema,
            example: {
              status: 400,
              message: 'limit: Number must be less than or equal to 100',
              timestamp: '2026-09-24T12:00:00.000Z',
              path: '/api/jobs',
            },
          },
        },
      },
    },
  });

  // 2. GET /api/jobs/mine (Recruiter List)
  registry.registerPath({
    method: 'get',
    path: '/api/jobs/mine',
    summary: "List recruiter's own jobs",
    description:
      "Retrieves all job postings (both OPEN and CLOSED) created by the authenticated recruiter. Isolated strictly to the caller's recruiter ID.\n\n**Required Role:** `RECRUITER`.",
    tags: ['Jobs'],
    security: [{ bearerAuth: [] }],
    request: {
      query: z.object({
        page: z.coerce.number().int().positive().default(1).optional().openapi({
          description: 'Page number',
          example: 1,
        }),
        limit: z.coerce.number().int().positive().max(100).default(10).optional().openapi({
          description: 'Page limit',
          example: 10,
        }),
      }),
    },
    responses: {
      200: {
        description: 'Recruiter jobs retrieved successfully',
        content: {
          'application/json': {
            schema: apiSuccessEnvelopeSchema(paginatedJobsSchema, 'Recruiter jobs retrieved successfully'),
          },
        },
      },
      401: {
        description: 'Missing, expired, or invalid token',
        content: {
          'application/json': {
            schema: apiErrorSchema,
            example: {
              status: 401,
              message: 'Authorization header missing',
              timestamp: '2026-09-24T12:00:00.000Z',
              path: '/api/jobs/mine',
            },
          },
        },
      },
      403: {
        description: 'Forbidden: Requires RECRUITER role',
        content: {
          'application/json': {
            schema: apiErrorSchema,
            example: {
              status: 403,
              message: 'Forbidden: Requires role RECRUITER. Current role: CANDIDATE',
              timestamp: '2026-09-24T12:00:00.000Z',
              path: '/api/jobs/mine',
            },
          },
        },
      },
    },
  });

  // 3. GET /api/jobs/{id} (Public Detail)
  registry.registerPath({
    method: 'get',
    path: '/api/jobs/{id}',
    summary: 'Get job by ID (Public)',
    description:
      'Retrieves the full details of a specific job posting. Returns 404 if the job does not exist or has been soft-deleted.\n\n**Required Role:** None (Public endpoint).',
    tags: ['Jobs'],
    request: {
      params: z.object({
        id: z.coerce.number().int().positive().openapi({
          description: 'Unique numeric ID of the job posting',
          example: 1,
        }),
      }),
    },
    responses: {
      200: {
        description: 'Job details retrieved successfully',
        content: {
          'application/json': {
            schema: apiSuccessEnvelopeSchema(jobEntitySchema, 'Job details retrieved successfully'),
          },
        },
      },
      400: {
        description: 'Invalid job ID parameter',
        content: {
          'application/json': {
            schema: apiErrorSchema,
            example: {
              status: 400,
              message: 'Job ID must be a positive integer',
              timestamp: '2026-09-24T12:00:00.000Z',
              path: '/api/jobs/invalid',
            },
          },
        },
      },
      404: {
        description: 'Job not found or soft-deleted',
        content: {
          'application/json': {
            schema: apiErrorSchema,
            example: {
              status: 404,
              message: 'Job not found',
              timestamp: '2026-09-24T12:00:00.000Z',
              path: '/api/jobs/99999',
            },
          },
        },
      },
    },
  });

  // 4. POST /api/jobs (Create Job)
  registry.registerPath({
    method: 'post',
    path: '/api/jobs',
    summary: 'Create a job posting',
    description:
      'Creates a new job listing. The `recruiter_id` is assigned strictly from the authenticated JWT token — any `recruiter_id` submitted in the request body is stripped and ignored.\n\n**Required Role:** `RECRUITER`.',
    tags: ['Jobs'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        description: 'Job creation payload',
        content: {
          'application/json': {
            schema: createJobSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Job created successfully',
        content: {
          'application/json': {
            schema: apiSuccessEnvelopeSchema(jobEntitySchema, 'Job created successfully'),
          },
        },
      },
      400: {
        description: 'Validation error (missing title, empty skills, etc.)',
        content: {
          'application/json': {
            schema: apiErrorSchema,
            example: {
              status: 400,
              message: 'title: Title must be at least 3 characters',
              timestamp: '2026-09-24T12:00:00.000Z',
              path: '/api/jobs',
            },
          },
        },
      },
      401: {
        description: 'Authentication required or invalid JWT',
        content: {
          'application/json': {
            schema: apiErrorSchema,
            example: {
              status: 401,
              message: 'Authorization header missing',
              timestamp: '2026-09-24T12:00:00.000Z',
              path: '/api/jobs',
            },
          },
        },
      },
      403: {
        description: 'Forbidden: Requires RECRUITER role',
        content: {
          'application/json': {
            schema: apiErrorSchema,
            example: {
              status: 403,
              message: 'Forbidden: Requires role RECRUITER. Current role: CANDIDATE',
              timestamp: '2026-09-24T12:00:00.000Z',
              path: '/api/jobs',
            },
          },
        },
      },
    },
  });

  // 5. PUT /api/jobs/{id} (Update Job)
  registry.registerPath({
    method: 'put',
    path: '/api/jobs/{id}',
    summary: 'Update job details',
    description:
      'Updates details of an existing job posting. Enforces strict ownership check: the authenticated recruiter must be the owner of the job.\n\n**Required Role:** `RECRUITER` (Job Owner).',
    tags: ['Jobs'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.coerce.number().int().positive().openapi({
          description: 'ID of the job to update',
          example: 1,
        }),
      }),
      body: {
        description: 'Fields to update (at least one field required)',
        content: {
          'application/json': {
            schema: updateJobSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Job updated successfully',
        content: {
          'application/json': {
            schema: apiSuccessEnvelopeSchema(jobEntitySchema, 'Job updated successfully'),
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: apiErrorSchema,
            example: {
              status: 400,
              message: 'At least one field must be provided for update',
              timestamp: '2026-09-24T12:00:00.000Z',
              path: '/api/jobs/1',
            },
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: apiErrorSchema,
          },
        },
      },
      403: {
        description: 'Forbidden: User is not the owner of this job',
        content: {
          'application/json': {
            schema: apiErrorSchema,
            example: {
              status: 403,
              message: 'Forbidden: You do not have permission to modify this job',
              timestamp: '2026-09-24T12:00:00.000Z',
              path: '/api/jobs/1',
            },
          },
        },
      },
      404: {
        description: 'Job not found',
        content: {
          'application/json': {
            schema: apiErrorSchema,
            example: {
              status: 404,
              message: 'Job not found',
              timestamp: '2026-09-24T12:00:00.000Z',
              path: '/api/jobs/99999',
            },
          },
        },
      },
    },
  });

  // 6. PATCH /api/jobs/{id}/status (Toggle Status)
  registry.registerPath({
    method: 'patch',
    path: '/api/jobs/{id}/status',
    summary: 'Toggle job status (OPEN / CLOSED)',
    description:
      'Toggles or sets the status of a job posting to either OPEN or CLOSED. Closed jobs are immediately omitted from the public search endpoint.\n\n**Required Role:** `RECRUITER` (Job Owner).',
    tags: ['Jobs'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.coerce.number().int().positive().openapi({
          description: 'ID of the job',
          example: 1,
        }),
      }),
      body: {
        description: 'New status value',
        content: {
          'application/json': {
            schema: updateStatusSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Job status updated successfully',
        content: {
          'application/json': {
            schema: apiSuccessEnvelopeSchema(jobEntitySchema, 'Job status updated successfully'),
          },
        },
      },
      400: {
        description: 'Invalid status value (must be OPEN or CLOSED)',
        content: {
          'application/json': {
            schema: apiErrorSchema,
            example: {
              status: 400,
              message: "Status must be either 'OPEN' or 'CLOSED'",
              timestamp: '2026-09-24T12:00:00.000Z',
              path: '/api/jobs/1/status',
            },
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: apiErrorSchema,
          },
        },
      },
      403: {
        description: 'Forbidden: User is not the owner of this job',
        content: {
          'application/json': {
            schema: apiErrorSchema,
            example: {
              status: 403,
              message: 'Forbidden: You do not have permission to modify this job',
              timestamp: '2026-09-24T12:00:00.000Z',
              path: '/api/jobs/1/status',
            },
          },
        },
      },
      404: {
        description: 'Job not found',
        content: {
          'application/json': {
            schema: apiErrorSchema,
            example: {
              status: 404,
              message: 'Job not found',
              timestamp: '2026-09-24T12:00:00.000Z',
              path: '/api/jobs/99999/status',
            },
          },
        },
      },
    },
  });

  // 7. DELETE /api/jobs/{id} (Soft-Delete)
  registry.registerPath({
    method: 'delete',
    path: '/api/jobs/{id}',
    summary: 'Soft-delete a job posting',
    description:
      'Soft-deletes a job posting by marking `is_deleted = true`. The job is retained in the database to safeguard foreign keys and audit history (applications, interviews), but is excluded from public search and recruiter dashboard listings.\n\n**Required Role:** `RECRUITER` (Job Owner).',
    tags: ['Jobs'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.coerce.number().int().positive().openapi({
          description: 'ID of the job to soft-delete',
          example: 1,
        }),
      }),
    },
    responses: {
      200: {
        description: 'Job deleted successfully',
        content: {
          'application/json': {
            schema: z.object({
              status: z.number().int().openapi({ example: 200 }),
              message: z.string().openapi({ example: 'Job deleted successfully' }),
            }),
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: apiErrorSchema,
          },
        },
      },
      403: {
        description: 'Forbidden: User is not the owner of this job',
        content: {
          'application/json': {
            schema: apiErrorSchema,
            example: {
              status: 403,
              message: 'Forbidden: You do not have permission to delete this job',
              timestamp: '2026-09-24T12:00:00.000Z',
              path: '/api/jobs/1',
            },
          },
        },
      },
      404: {
        description: 'Job not found',
        content: {
          'application/json': {
            schema: apiErrorSchema,
            example: {
              status: 404,
              message: 'Job not found',
              timestamp: '2026-09-24T12:00:00.000Z',
              path: '/api/jobs/99999',
            },
          },
        },
      },
    },
  });
}

module.exports = { registerJobsOpenApi };
