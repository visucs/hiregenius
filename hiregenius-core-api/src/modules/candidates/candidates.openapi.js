const { z } = require('zod');
const { apiErrorSchema, apiSuccessEnvelopeSchema } = require('../jobs/jobs.validation');


const atsResultSchema = z
  .object({
    candidate_id: z.string().nullable().openapi({ example: '102' }),
    job_id: z.string().nullable().openapi({ example: '5' }),
    overall_score: z.number().openapi({ example: 85.5 }),
    match_strength: z.string().openapi({ example: 'Good Match' }),
    mode: z.enum(['general', 'job_specific']).openapi({ example: 'general' }),
    score_breakdown: z.record(z.any()).openapi({
      example: { sections: 45.0, length: 22.5, format: 20.0 },
    }),
    detected_sections: z.record(z.boolean()).openapi({
      example: { Experience: true, Education: true, Skills: true, Projects: true },
    }),
    format_signals: z.record(z.any()).openapi({
      example: { has_bullets: true, has_dates: true, quantified_impact: true, action_verbs: true },
    }),
    keyword_analysis: z.any().nullable().openapi({
      example: {
        match_percentage: 80.0,
        matched_keywords: ['Python', 'FastAPI'],
        missing_keywords: ['Docker'],
        extracted_jd_keywords: ['Python', 'FastAPI', 'Docker'],
      },
    }),
    category_prediction: z.any().nullable().openapi({
      example: {
        predicted_category: 'Python Developer',
        match_strength: 'High',
        low_confidence: false,
      },
    }),
    suggestions: z.array(z.string()).openapi({
      example: ['Add quantified impact metrics to your experience section.'],
    }),
    parsability: z.any().nullable().openapi({
      example: { page_count: 1, text_density: 450.5, has_text_layer: true },
    }),
    created_at: z.string().openapi({ example: '2026-10-22T00:00:00.000Z' }),
  })
  .openapi('ATSCheckResult');

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

  // POST /api/candidates/me/ats-check
  registry.registerPath({
    method: 'post',
    path: '/api/candidates/me/ats-check',
    summary: 'Evaluate candidate resume structure & ATS readability (general check)',
    description: 'Evaluates resume formatting, section detection, and readability. Supports optional multipart file; if omitted, evaluates candidate stored resume.\n\n**Required Role:** CANDIDATE',
    tags: ['Candidates', 'ATS'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        description: 'Optional multipart form-data containing the resume file',
        required: false,
        content: {
          'multipart/form-data': {
            schema: z.object({
              resume: z.string().optional().openapi({ type: 'string', format: 'binary', description: 'Optional resume file (PDF or DOCX)' }),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'ATS evaluation completed successfully',
        content: {
          'application/json': {
            schema: apiSuccessEnvelopeSchema(atsResultSchema, 'ATS evaluation completed successfully'),
          },
        },
      },
      400: { description: 'Missing stored resume or invalid input', content: { 'application/json': { schema: apiErrorSchema } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: apiErrorSchema } } },
      403: { description: 'Forbidden', content: { 'application/json': { schema: apiErrorSchema } } },
      422: { description: 'Unprocessable document (scanned/corrupted)', content: { 'application/json': { schema: apiErrorSchema } } },
      429: { description: 'Rate limit exceeded (10 checks/min)', content: { 'application/json': { schema: apiErrorSchema } } },
      503: { description: 'AI service unavailable', content: { 'application/json': { schema: apiErrorSchema } } },
    },
  });

  // GET /api/candidates/me/ats
  registry.registerPath({
    method: 'get',
    path: '/api/candidates/me/ats',
    summary: 'Get candidate ATS evaluation history',
    description: 'Retrieves candidate own ATS result (optional ?jobId= query).\n\n**Required Role:** CANDIDATE',
    tags: ['Candidates', 'ATS'],
    security: [{ bearerAuth: [] }],
    request: {
      query: z.object({
        jobId: z.coerce.number().optional().openapi({ description: 'Optional Job ID filter', example: 1 }),
      }),
    },
    responses: {
      200: {
        description: 'ATS evaluation retrieved successfully',
        content: {
          'application/json': {
            schema: apiSuccessEnvelopeSchema(atsResultSchema, 'ATS evaluation retrieved successfully'),
          },
        },
      },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: apiErrorSchema } } },
      403: { description: 'Forbidden', content: { 'application/json': { schema: apiErrorSchema } } },
      404: { description: 'No ATS evaluation found', content: { 'application/json': { schema: apiErrorSchema } } },
      429: { description: 'Rate limit exceeded', content: { 'application/json': { schema: apiErrorSchema } } },
      503: { description: 'AI service unavailable', content: { 'application/json': { schema: apiErrorSchema } } },
    },
  });

}

module.exports = {
  candidateEntitySchema,
  atsResultSchema,
  registerCandidatesOpenApi,
};
