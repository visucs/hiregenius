const { z } = require('zod');

const allowedStatuses = ['APPLIED', 'SCREENING', 'INTERVIEW', 'SHORTLISTED', 'REJECTED', 'HIRED'];

const createApplicationSchema = z.object({
  jobId: z.coerce.number().int().positive('Job ID must be a positive integer'),
});

const updateStatusSchema = z.object({
  status: z
    .string()
    .trim()
    .refine((val) => allowedStatuses.includes(val), {
      message: `Status must be one of: ${allowedStatuses.join(', ')}`,
    }),
});

const applicationIdParamSchema = z.object({
  id: z.coerce.number().int().positive('Application ID must be a positive integer'),
});

const jobIdParamSchema = z.object({
  jobId: z.coerce.number().int().positive('Job ID must be a positive integer'),
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
  createApplicationSchema,
  updateStatusSchema,
  applicationIdParamSchema,
  jobIdParamSchema,
  validate,
};
