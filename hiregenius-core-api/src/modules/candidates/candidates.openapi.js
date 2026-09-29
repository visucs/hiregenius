const { z } = require('zod');
const { apiErrorSchema, apiSuccessEnvelopeSchema } = require('../jobs/jobs.validation');

const candidateEntitySchema = z
  .object({
    id: z.number().int().positive().openapi({ example: 1 }),
    user_id: z.number().int().positive().openapi({ example: 301, description: 'User ID of the candidate' }),
    resume_path: z.string().nullable().openapi({ example: 'uploads/resumes/resume-1727289999-my_cv.pdf' }),
    resume_original_name: z.string().nullable().openapi({ example: 'my_cv.pdf' }),
    created_at: z.string().openapi({ example: '2026-09-25T12:00:00.000Z' }),
    updated_at: z.string().openapi({ example: '2026-09-25T12:00:00.000Z' }),
  })
  .openapi('Candidate');

function registerCandidatesOpenApi(registry) {
  // 1. POST /api/candidates/me/resume
  registry.registerPath({
    method: 'post',
    path: '/api/candidates/me/resume',
    summary: 'Upload/update candidate resume',
    description: 'Uploads a PDF or DOCX resume (max 5MB) for the authenticated candidate. Creates candidate profile if one does not exist yet.\n\n**Required Role:** CANDIDATE',
    tags: ['Candidates'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        description: 'Multipart form-data containing the resume file',
        required: true,
        content: {
          'multipart/form-data': {
            schema: z.object({
              resume: z.string().openapi({ type: 'string', format: 'binary', description: 'Resume file (PDF or DOCX, max 5MB)' }),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Resume updated successfully',
        content: {
          'application/json': {
            schema: apiSuccessEnvelopeSchema(candidateEntitySchema, 'Resume updated successfully'),
          },
        },
      },
      201: {
        description: 'Resume uploaded and profile created successfully',
        content: {
          'application/json': {
            schema: apiSuccessEnvelopeSchema(candidateEntitySchema, 'Resume uploaded successfully'),
          },
        },
      },
      400: {
        description: 'Invalid file type or file exceeds 5MB',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
      401: {
        description: 'Unauthorized',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
      403: {
        description: 'Forbidden: Requires role CANDIDATE',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
    },
  });

  // 2. GET /api/candidates/me
  registry.registerPath({
    method: 'get',
    path: '/api/candidates/me',
    summary: 'Get candidate own profile',
    description: 'Retrieves the authenticated candidate profile and resume details.\n\n**Required Role:** CANDIDATE',
    tags: ['Candidates'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Candidate profile retrieved successfully',
        content: {
          'application/json': {
            schema: apiSuccessEnvelopeSchema(candidateEntitySchema, 'Candidate profile retrieved successfully'),
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
      404: {
        description: 'Candidate profile not found',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
    },
  });

  // 3. GET /api/candidates/{id}
  registry.registerPath({
    method: 'get',
    path: '/api/candidates/{id}',
    summary: 'Get candidate detail (Recruiter)',
    description: 'Retrieves candidate profile for a recruiter whose job the candidate applied to.\n\n**Required Role:** RECRUITER (must have application link to candidate)',
    tags: ['Candidates'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.coerce.number().int().positive().openapi({ example: 1 }),
      }),
    },
    responses: {
      200: {
        description: 'Candidate details retrieved successfully',
        content: {
          'application/json': {
            schema: apiSuccessEnvelopeSchema(candidateEntitySchema, 'Candidate details retrieved successfully'),
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
      403: {
        description: 'Forbidden: Recruiter does not have an application from this candidate',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
      404: {
        description: 'Candidate not found',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
    },
  });
}

module.exports = {
  candidateEntitySchema,
  registerCandidatesOpenApi,
};
