const { z } = require('zod');

const updateSettingsSchema = z
  .object({
    platformName: z.string().trim().min(1, 'Platform name cannot be empty').max(100).optional(),
    supportEmail: z.string().trim().email('Valid support email is required').max(150).optional(),
    maxJobsPerRecruiter: z.number().int().min(1, 'Max jobs per recruiter must be at least 1').max(10000).optional(),
    maxCandidatesPerJob: z.number().int().min(1, 'Max candidates per job must be at least 1').max(50000).optional(),
    aiResumeScreeningEnabled: z.boolean().optional(),
    aiInterviewEnabled: z.boolean().optional(),
    openRegistrationEnabled: z.boolean().optional(),
    maintenanceModeEnabled: z.boolean().optional(),
  })
  .strict();

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
  updateSettingsSchema,
  validate,
};
