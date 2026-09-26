const { z } = require('zod');

const allowedStatuses = ['SCHEDULED', 'COMPLETED', 'CANCELLED'];

const createInterviewSchema = z.object({
  applicationId: z.coerce.number().int().positive('Application ID must be a positive integer'),
  scheduledAt: z
    .string({ required_error: 'scheduledAt is required' })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'scheduledAt must be a valid ISO 8601 datetime',
    })
    .refine((val) => new Date(val) > new Date(), {
      message: 'Interview cannot be scheduled in the past',
    }),
  meetingLink: z
    .string()
    .url('meetingLink must be a valid URL')
    .optional()
    .nullable(),
});

const updateInterviewSchema = z
  .object({
    scheduledAt: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'scheduledAt must be a valid ISO 8601 datetime',
      })
      .refine((val) => new Date(val) > new Date(), {
        message: 'Interview cannot be scheduled in the past',
      })
      .optional(),
    meetingLink: z
      .string()
      .url('meetingLink must be a valid URL')
      .optional()
      .nullable(),
    status: z
      .string()
      .trim()
      .refine((val) => allowedStatuses.includes(val), {
        message: `Status must be one of: ${allowedStatuses.join(', ')}`,
      })
      .optional(),
  })
  .refine(
    (data) =>
      data.scheduledAt !== undefined ||
      data.meetingLink !== undefined ||
      data.status !== undefined,
    {
      message: 'At least one field (scheduledAt, meetingLink, status) must be provided for update',
    },
  );

const interviewIdParamSchema = z.object({
  id: z.coerce.number().int().positive('Interview ID must be a positive integer'),
});

const listInterviewsQuerySchema = z.object({
  status: z
    .string()
    .trim()
    .refine((val) => allowedStatuses.includes(val), {
      message: `Status must be one of: ${allowedStatuses.join(', ')}`,
    })
    .optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * Express middleware validator helper
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
  allowedStatuses,
  createInterviewSchema,
  updateInterviewSchema,
  interviewIdParamSchema,
  listInterviewsQuerySchema,
  validate,
};
