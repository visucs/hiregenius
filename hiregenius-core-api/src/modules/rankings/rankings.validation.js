const { z } = require('zod');

const jobIdParamSchema = z.object({
  jobId: z.coerce.number().int().positive('Job ID must be a positive integer'),
});

const historyQuerySchema = z.object({
  page: z.coerce.number().int().min(1, 'Page must be >= 1').default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be >= 1').max(50, 'Limit cannot exceed 50').default(10),
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
  jobIdParamSchema,
  historyQuerySchema,
  validate,
};
