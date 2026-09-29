const { z } = require('zod');
const { extendZodWithOpenApi } = require('@asteasolutions/zod-to-openapi');

extendZodWithOpenApi(z);

// Skills schema: Accepts array of strings or comma-separated string
const skillsSchema = z
  .union([
    z
      .array(z.string().trim().min(1))
      .min(1, 'At least one skill is required')
      .openapi({
        type: 'array',
        items: { type: 'string' },
        example: ['React', 'Node.js', 'MySQL', 'Docker'],
        description: 'Array of technical skills required for this job',
      }),
    z.string().transform((val) => {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // Fallback to comma-separated
      }
      return val
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }),
  ])
  .refine((val) => Array.isArray(val) && val.length > 0, {
    message: 'At least one valid skill is required',
  })
  .openapi({
    description: 'Skills list as an array of strings or comma-separated string',
    example: ['React', 'Node.js', 'MySQL'],
  });

const createJobSchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(255).openapi({
      description: 'Job posting title',
      example: 'Senior Full Stack Engineer',
    }),
    company: z.string().trim().min(2, 'Company must be at least 2 characters').max(255).openapi({
      description: 'Hiring company name',
      example: 'Acme Cloud Technologies',
    }),
    skills: skillsSchema,
    salary: z.string().trim().max(100).optional().nullable().openapi({
      description: 'Compensation range or details',
      example: '$130,000 - $160,000',
    }),
    experience: z.string().trim().max(100).optional().nullable().openapi({
      description: 'Required experience level',
      example: '5+ years',
    }),
    location: z.string().trim().max(255).optional().nullable().openapi({
      description: 'Work location or Remote status',
      example: 'San Francisco, CA / Remote',
    }),
    description: z.string().trim().min(10, 'Description must be at least 10 characters').openapi({
      description: 'Detailed job description and responsibilities',
      example: 'Lead full-stack development of microservices and AI agent workflows.',
    }),
    status: z.enum(['OPEN', 'CLOSED']).default('OPEN').optional().openapi({
      description: 'Initial job listing status',
      example: 'OPEN',
    }),
  })
  .openapi('CreateJobInput');

const updateJobSchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(255).optional().openapi({
      description: 'Updated job title',
      example: 'Lead Distributed Systems Architect',
    }),
    company: z.string().trim().min(2, 'Company must be at least 2 characters').max(255).optional().openapi({
      description: 'Updated company name',
      example: 'Acme Cloud Technologies',
    }),
    skills: skillsSchema.optional(),
    salary: z.string().trim().max(100).optional().nullable().openapi({
      description: 'Updated salary range',
      example: '$150,000 - $180,000',
    }),
    experience: z.string().trim().max(100).optional().nullable().openapi({
      description: 'Updated experience requirement',
      example: '6+ years',
    }),
    location: z.string().trim().max(255).optional().nullable().openapi({
      description: 'Updated location',
      example: 'Remote, US',
    }),
    description: z.string().trim().min(10, 'Description must be at least 10 characters').optional().openapi({
      description: 'Updated description',
      example: 'Architect ultra low-latency APIs and supervise backend microservices.',
    }),
    status: z.enum(['OPEN', 'CLOSED']).optional().openapi({
      description: 'Updated status',
      example: 'OPEN',
    }),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  })
  .openapi('UpdateJobInput');

const updateStatusSchema = z
  .object({
    status: z.enum(['OPEN', 'CLOSED'], {
      errorMap: () => ({ message: "Status must be either 'OPEN' or 'CLOSED'" }),
    }).openapi({
      description: 'New job status (OPEN or CLOSED)',
      example: 'CLOSED',
    }),
  })
  .openapi('UpdateJobStatusInput');

const jobIdParamSchema = z
  .object({
    id: z.coerce.number().int().positive('Job ID must be a positive integer').openapi({
      description: 'Job ID (primary key)',
      example: 1,
    }),
  })
  .openapi('JobIdParam');

const listJobsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1).optional().openapi({
      description: 'Page number for pagination (starts at 1)',
      example: 1,
    }),
    limit: z.coerce.number().int().positive().max(100).default(10).optional().openapi({
      description: 'Number of jobs per page (max 100)',
      example: 10,
    }),
    title: z.string().trim().optional().openapi({
      description: 'Filter by job title (partial match)',
      example: 'Engineer',
    }),
    company: z.string().trim().optional().openapi({
      description: 'Filter by company name (partial match)',
      example: 'Acme',
    }),
    location: z.string().trim().optional().openapi({
      description: 'Filter by location (partial match)',
      example: 'Remote',
    }),
  })
  .openapi('ListJobsQuery');

// Full Job entity representation in API responses
const jobEntitySchema = z
  .object({
    id: z.number().int().positive().openapi({ example: 1 }),
    recruiter_id: z.number().int().positive().openapi({ example: 101, description: 'ID of the recruiter who posted this job' }),
    title: z.string().openapi({ example: 'Senior Full Stack Engineer' }),
    company: z.string().openapi({ example: 'Acme Cloud Technologies' }),
    skills: z.array(z.string()).openapi({ example: ['React', 'Node.js', 'MySQL', 'Docker'] }),
    salary: z.string().nullable().openapi({ example: '$130,000 - $160,000' }),
    experience: z.string().nullable().openapi({ example: '5+ years' }),
    location: z.string().nullable().openapi({ example: 'San Francisco, CA / Remote' }),
    description: z.string().openapi({ example: 'Lead full-stack development of microservices.' }),
    status: z.enum(['OPEN', 'CLOSED']).openapi({ example: 'OPEN' }),
    is_deleted: z.boolean().openapi({ example: false }),
    created_at: z.string().openapi({ example: '2026-09-24T11:00:00.000Z' }),
    updated_at: z.string().openapi({ example: '2026-09-24T11:00:00.000Z' }),
  })
  .openapi('Job');

// Paginated jobs response schema
const paginatedJobsSchema = z
  .object({
    jobs: z.array(jobEntitySchema),
    total: z.number().int().openapi({ example: 25, description: 'Total matching jobs' }),
    page: z.number().int().openapi({ example: 1, description: 'Current page number' }),
    limit: z.number().int().openapi({ example: 10, description: 'Items per page' }),
    totalPages: z.number().int().openapi({ example: 3, description: 'Total available pages' }),
  })
  .openapi('PaginatedJobs');

// Standard error envelope schema matching ApiError.js & errorHandler.js
const apiErrorSchema = z
  .object({
    status: z.number().int().openapi({ example: 400 }),
    message: z.string().openapi({ example: 'Title must be at least 3 characters' }),
    timestamp: z.string().openapi({ example: '2026-09-24T12:00:00.000Z' }),
    path: z.string().openapi({ example: '/api/jobs' }),
    details: z.any().optional().openapi({ description: 'Optional error details' }),
  })
  .openapi('ApiError');

// Standard success envelope schema matching ApiResponse.js
const apiSuccessEnvelopeSchema = (dataSchema, exampleMessage = 'Success') =>
  z.object({
    status: z.number().int().openapi({ example: 200 }),
    message: z.string().openapi({ example: exampleMessage }),
    data: dataSchema,
  });

/**
 * Express middleware validator
 * @param {import('zod').ZodSchema} schema
 * @param {'body' | 'query' | 'params'} source
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = {
  createJobSchema,
  updateJobSchema,
  updateStatusSchema,
  jobIdParamSchema,
  listJobsQuerySchema,
  jobEntitySchema,
  paginatedJobsSchema,
  apiErrorSchema,
  apiSuccessEnvelopeSchema,
  validate,
};
