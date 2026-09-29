const { z } = require('zod');

const recruiterSummaryQuerySchema = z.object({
  days: z
    .preprocess((val) => {
      if (val === undefined || val === null || val === '') return undefined;
      const num = Number(val);
      return isNaN(num) ? val : num;
    }, z.number({ invalid_type_error: 'days must be a number' })
      .int({ message: 'days must be an integer' })
      .positive({ message: 'days must be a positive integer' })
      .max(365, { message: 'days cannot exceed 365' })
      .optional()),
});

const recruiterTrendQuerySchema = z.object({
  days: z
    .preprocess((val) => {
      if (val === undefined || val === null || val === '') return undefined;
      const num = Number(val);
      return isNaN(num) ? val : num;
    }, z.number({ invalid_type_error: 'days must be a number' })
      .int({ message: 'days must be an integer' })
      .positive({ message: 'days must be a positive integer' })
      .max(365, { message: 'days cannot exceed 365' })
      .optional()),
});

const topRecruitersQuerySchema = z.object({
  limit: z
    .preprocess((val) => {
      if (val === undefined || val === null || val === '') return undefined;
      const num = Number(val);
      return isNaN(num) ? val : num;
    }, z.number({ invalid_type_error: 'limit must be a number' })
      .int({ message: 'limit must be an integer' })
      .positive({ message: 'limit must be a positive integer' })
      .max(100, { message: 'limit cannot exceed 100' })
      .optional()),
  sortBy: z.enum(['applications', 'jobs']).optional(),
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
  recruiterSummaryQuerySchema,
  recruiterTrendQuerySchema,
  topRecruitersQuerySchema,
  validate,
};
