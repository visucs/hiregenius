const { z } = require('zod');
const { apiErrorSchema, apiSuccessEnvelopeSchema } = require('../jobs/jobs.validation');
const { allowedStatuses } = require('./applications.validation');

const applicationEntitySchema = z
  .object({
    id: z.number().int().positive().openapi({ example: 1 }),
    job_id: z.number().int().positive().openapi({ example: 10 }),
    candidate_id: z.number().int().positive().openapi({ example: 5 }),
    status: z.enum(allowedStatuses).openapi({ example: 'APPLIED' }),
    applied_at: z.string().openapi({ example: '2026-09-25T12:00:00.000Z' }),
    updated_at: z.string().openapi({ example: '2026-09-25T12:00:00.000Z' }),
    job_title: z.string().optional().openapi({ example: 'Senior Backend Engineer' }),
    job_company: z.string().optional().openapi({ example: 'Acme Corp' }),
    job_location: z.string().nullable().optional().openapi({ example: 'Remote' }),
    job_status: z.string().optional().openapi({ example: 'OPEN' }),
    candidate_name: z.string().nullable().optional().openapi({ example: 'John Doe' }),
    candidate_email: z.string().nullable().optional().openapi({ example: 'john@example.com' }),
    resume_path: z.string().nullable().optional().openapi({ example: 'uploads/resumes/resume.pdf' }),
  })
  .openapi('Application');

function registerApplicationsOpenApi(registry) {
  // 1. POST /api/applications
  registry.registerPath({
    method: 'post',
    path: '/api/applications',
    summary: 'Apply to a job',
    description: 'Submits an application to an open job for the authenticated candidate.\n\n**Required Role:** CANDIDATE',
    tags: ['Applications'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: z.object({
              jobId: z.number().int().positive().openapi({ example: 1 }),
            }),
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Application submitted successfully',
        content: {
          'application/json': {
            schema: apiSuccessEnvelopeSchema(applicationEntitySchema, 'Application submitted successfully'),
          },
        },
      },
      400: {
        description: 'Missing resume or job is closed',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
      404: {
        description: 'Job not found',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
      409: {
        description: 'Already applied for this job',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
    },
  });

  // 2. GET /api/applications/mine
  registry.registerPath({
    method: 'get',
    path: '/api/applications/mine',
    summary: 'List candidate own applications',
    description: 'Retrieves all applications submitted by the logged-in candidate.\n\n**Required Role:** CANDIDATE',
    tags: ['Applications'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Applications retrieved successfully',
        content: {
          'application/json': {
            schema: apiSuccessEnvelopeSchema(z.array(applicationEntitySchema), 'Applications retrieved successfully'),
          },
        },
      },
    },
  });

  // 3. GET /api/jobs/{jobId}/applications
  registry.registerPath({
    method: 'get',
    path: '/api/jobs/{jobId}/applications',
    summary: 'List applications for a job (Recruiter)',
    description: 'Retrieves all applications for a specific job owned by the calling recruiter.\n\n**Required Role:** RECRUITER (owner only)',
    tags: ['Applications'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        jobId: z.coerce.number().int().positive().openapi({ example: 1 }),
      }),
    },
    responses: {
      200: {
        description: 'Job applications retrieved successfully',
        content: {
          'application/json': {
            schema: apiSuccessEnvelopeSchema(z.array(applicationEntitySchema), 'Job applications retrieved successfully'),
          },
        },
      },
      403: {
        description: 'Forbidden: Recruiter does not own this job',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
      404: {
        description: 'Job not found',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
    },
  });

  // 4. PATCH /api/applications/{id}/status
  registry.registerPath({
    method: 'patch',
    path: '/api/applications/{id}/status',
    summary: 'Update application status (Recruiter)',
    description: 'Updates candidate application status for a job owned by the calling recruiter.\n\n**Required Role:** RECRUITER (owner only)',
    tags: ['Applications'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.coerce.number().int().positive().openapi({ example: 1 }),
      }),
      body: {
        required: true,
        content: {
          'application/json': {
            schema: z.object({
              status: z.enum(allowedStatuses).openapi({ example: 'SHORTLISTED' }),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Application status updated successfully',
        content: {
          'application/json': {
            schema: apiSuccessEnvelopeSchema(applicationEntitySchema, 'Application status updated successfully'),
          },
        },
      },
      400: {
        description: 'Invalid status string',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
      403: {
        description: 'Forbidden: Recruiter does not own the job for this application',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
      404: {
        description: 'Application not found',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
    },
  });

  // 5. GET /api/applications/{id}
  registry.registerPath({
    method: 'get',
    path: '/api/applications/{id}',
    summary: 'Get application details',
    description: 'Retrieves application details. Allowed for the applying candidate OR the recruiter who posted the job.\n\n**Required Role:** CANDIDATE (own application) or RECRUITER (own job)',
    tags: ['Applications'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.coerce.number().int().positive().openapi({ example: 1 }),
      }),
    },
    responses: {
      200: {
        description: 'Application details retrieved successfully',
        content: {
          'application/json': {
            schema: apiSuccessEnvelopeSchema(applicationEntitySchema, 'Application details retrieved successfully'),
          },
        },
      },
      403: {
        description: 'Forbidden: User not authorized to view this application',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
      404: {
        description: 'Application not found',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
    },
  });
}

module.exports = {
  applicationEntitySchema,
  registerApplicationsOpenApi,
};
