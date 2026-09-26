const { z } = require('zod');
const { apiErrorSchema, apiSuccessEnvelopeSchema } = require('../jobs/jobs.validation');
const { allowedStatuses } = require('./interviews.validation');

const interviewEntitySchema = z
  .object({
    id: z.number().int().positive().openapi({ example: 1 }),
    application_id: z.number().int().positive().openapi({ example: 10 }),
    scheduled_at: z.string().openapi({ example: '2026-10-15T14:00:00.000Z' }),
    meeting_link: z.string().nullable().optional().openapi({ example: 'https://meet.google.com/abc-defg-hij' }),
    status: z.enum(allowedStatuses).openapi({ example: 'SCHEDULED' }),
    created_by: z.number().int().positive().openapi({ example: 25 }),
    created_at: z.string().openapi({ example: '2026-09-26T12:00:00.000Z' }),
    updated_at: z.string().openapi({ example: '2026-09-26T12:00:00.000Z' }),
    application_status: z.string().optional().openapi({ example: 'INTERVIEW' }),
    job_id: z.number().optional().openapi({ example: 5 }),
    job_title: z.string().optional().openapi({ example: 'Senior Backend Engineer' }),
    job_company: z.string().optional().openapi({ example: 'Acme Corp' }),
    recruiter_id: z.number().optional().openapi({ example: 25 }),
    candidate_id: z.number().optional().openapi({ example: 3 }),
    candidate_user_id: z.number().optional().openapi({ example: 8 }),
    candidate_name: z.string().nullable().optional().openapi({ example: 'John Doe' }),
    candidate_email: z.string().nullable().optional().openapi({ example: 'john@example.com' }),
    recruiter_name: z.string().nullable().optional().openapi({ example: 'Jane Recruiter' }),
    recruiter_email: z.string().nullable().optional().openapi({ example: 'jane@example.com' }),
  })
  .openapi('Interview');

const candidateInterviewSchema = z
  .object({
    id: z.number().int().positive().openapi({ example: 1 }),
    application_id: z.number().int().positive().openapi({ example: 10 }),
    scheduled_at: z.string().openapi({ example: '2026-10-15T14:00:00.000Z' }),
    meeting_link: z.string().nullable().optional().openapi({ example: 'https://meet.google.com/abc-defg-hij' }),
    status: z.enum(allowedStatuses).openapi({ example: 'SCHEDULED' }),
    created_by: z.number().int().positive().openapi({ example: 25 }),
    created_at: z.string().openapi({ example: '2026-09-26T12:00:00.000Z' }),
    updated_at: z.string().openapi({ example: '2026-09-26T12:00:00.000Z' }),
    job_id: z.number().optional().openapi({ example: 5 }),
    job_title: z.string().optional().openapi({ example: 'Senior Backend Engineer' }),
    job_company: z.string().optional().openapi({ example: 'Acme Corp' }),
  })
  .openapi('CandidateInterview');

const paginatedInterviewsSchema = z
  .object({
    interviews: z.array(interviewEntitySchema),
    total: z.number().int().openapi({ example: 1 }),
    page: z.number().int().openapi({ example: 1 }),
    limit: z.number().int().openapi({ example: 20 }),
    totalPages: z.number().int().openapi({ example: 1 }),
  })
  .openapi('PaginatedInterviews');

function registerInterviewsOpenApi(registry) {
  // 1. POST /api/interviews
  registry.registerPath({
    method: 'post',
    path: '/api/interviews',
    summary: 'Schedule an interview',
    description: 'Schedules an interview for an application. Enforces one interview per application, future datetime, and recruiter ownership.\n\n**Required Role:** RECRUITER',
    tags: ['Interviews'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: z.object({
              applicationId: z.number().int().positive().openapi({ example: 1 }),
              scheduledAt: z.string().openapi({ example: '2026-10-15T14:00:00.000Z' }),
              meetingLink: z.string().url().optional().nullable().openapi({ example: 'https://meet.google.com/abc-defg-hij' }),
            }),
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Interview scheduled successfully',
        content: {
          'application/json': {
            schema: apiSuccessEnvelopeSchema(interviewEntitySchema, 'Interview scheduled successfully'),
          },
        },
      },
      400: {
        description: 'Validation error or date in the past',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
      403: {
        description: 'Forbidden - not recruiter of job',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
      404: {
        description: 'Application not found',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
      409: {
        description: 'Interview already scheduled for this application',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
    },
  });

  // 2. GET /api/interviews
  registry.registerPath({
    method: 'get',
    path: '/api/interviews',
    summary: 'Get scheduled interviews for recruiter',
    description: 'Retrieves interviews scheduled by or belonging to jobs owned by the authenticated recruiter.\n\n**Required Role:** RECRUITER',
    tags: ['Interviews'],
    security: [{ bearerAuth: [] }],
    request: {
      query: z.object({
        status: z.enum(allowedStatuses).optional().openapi({ example: 'SCHEDULED' }),
        page: z.string().optional().openapi({ example: '1' }),
        limit: z.string().optional().openapi({ example: '20' }),
      }),
    },
    responses: {
      200: {
        description: 'Interviews retrieved successfully',
        content: {
          'application/json': {
            schema: apiSuccessEnvelopeSchema(paginatedInterviewsSchema, 'Interviews retrieved successfully'),
          },
        },
      },
      401: {
        description: 'Unauthorized - invalid or missing token',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
      403: {
        description: 'Forbidden - requires RECRUITER role',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
    },
  });

  // 3. GET /api/interviews/{id}
  registry.registerPath({
    method: 'get',
    path: '/api/interviews/{id}',
    summary: 'Get interview details',
    description: 'Retrieves full details of an interview. Enforces dual ownership (Recruiter owner or Candidate applicant).\n\n**Required Role:** RECRUITER or CANDIDATE',
    tags: ['Interviews'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().openapi({ example: '1', description: 'Interview ID' }),
      }),
    },
    responses: {
      200: {
        description: 'Interview details retrieved successfully',
        content: {
          'application/json': {
            schema: apiSuccessEnvelopeSchema(interviewEntitySchema, 'Interview details retrieved successfully'),
          },
        },
      },
      403: {
        description: 'Forbidden - not authorized to view this interview',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
      404: {
        description: 'Interview not found',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
    },
  });

  // 4. PATCH /api/interviews/{id}
  registry.registerPath({
    method: 'patch',
    path: '/api/interviews/{id}',
    summary: 'Update interview details or status',
    description: 'Allows the owning recruiter to update scheduled time, meeting link, or status.\n\n**Required Role:** RECRUITER',
    tags: ['Interviews'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().openapi({ example: '1', description: 'Interview ID' }),
      }),
      body: {
        required: true,
        content: {
          'application/json': {
            schema: z.object({
              scheduledAt: z.string().optional().openapi({ example: '2026-10-16T14:00:00.000Z' }),
              meetingLink: z.string().url().optional().nullable().openapi({ example: 'https://meet.google.com/xyz-uvwx-rst' }),
              status: z.enum(allowedStatuses).optional().openapi({ example: 'CANCELLED' }),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Interview updated successfully',
        content: {
          'application/json': {
            schema: apiSuccessEnvelopeSchema(interviewEntitySchema, 'Interview updated successfully'),
          },
        },
      },
      400: {
        description: 'Validation error or date in past',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
      403: {
        description: 'Forbidden - not the owning recruiter',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
      404: {
        description: 'Interview not found',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
    },
  });

  // 5. GET /api/candidates/me/interviews
  registry.registerPath({
    method: 'get',
    path: '/api/candidates/me/interviews',
    summary: 'Get candidate interviews',
    description: 'Retrieves all interviews scheduled for the authenticated candidate.\n\n**Required Role:** CANDIDATE',
    tags: ['Interviews', 'Candidates'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Candidate interviews retrieved successfully',
        content: {
          'application/json': {
            schema: apiSuccessEnvelopeSchema(z.array(candidateInterviewSchema), 'Candidate interviews retrieved successfully'),
          },
        },
      },
      401: {
        description: 'Unauthorized - invalid or missing token',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
      403: {
        description: 'Forbidden - requires CANDIDATE role',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
    },
  });
}

module.exports = {
  interviewEntitySchema,
  candidateInterviewSchema,
  registerInterviewsOpenApi,
};
