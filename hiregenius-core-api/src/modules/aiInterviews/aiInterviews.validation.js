const { z } = require('zod');

const generateAiInterviewSchema = z.object({
  applicationId: z.coerce.number().int().positive('Application ID must be a positive integer'),
  windowStart: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
  windowEnd: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
  durationMinutes: z.coerce.number().int().min(10).max(120).default(30),
  questionCount: z.coerce.number().int().min(4).max(10).default(6),
});

const updateQuestionsSchema = z.object({
  questions: z.array(
    z.object({
      id: z.coerce.number().int().positive(),
      text: z.string().trim().min(5, 'Question text must be at least 5 characters').max(1000).optional(),
      type: z.enum(['TECHNICAL', 'BEHAVIORAL', 'RESUME_PROBE', 'SCENARIO']).optional(),
      difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
      expectedPoints: z.array(z.string().trim()).optional(),
    })
  ).optional(),
  orderedQuestionIds: z.array(z.coerce.number().int().positive()).optional(),
});

const publishInterviewSchema = z.object({
  windowStart: z.string().optional(),
  windowEnd: z.string().optional(),
  durationMinutes: z.coerce.number().int().min(10).max(120).optional(),
});

const startInterviewSchema = z.object({
  consentAcknowledged: z.boolean({
    required_error: 'Consent acknowledgment is mandatory before entering the AI interview room.',
  }).refine((val) => val === true, {
    message: 'You must acknowledge the AI assessment notice to begin.',
  }),
});

const autosaveAnswerSchema = z.object({
  answerText: z.string().max(2000, 'Answer cannot exceed 2,000 characters').default(''),
});

const releaseFeedbackSchema = z.object({
  released: z.boolean().default(true),
});

const interviewIdParamSchema = z.object({
  id: z.coerce.number().int().positive('Interview ID must be a positive integer'),
});

const questionIdParamSchema = z.object({
  id: z.coerce.number().int().positive('Interview ID must be a positive integer'),
  questionId: z.coerce.number().int().positive('Question ID must be a positive integer'),
});

const jobIdParamSchema = z.object({
  jobId: z.coerce.number().int().positive('Job ID must be a positive integer'),
});

/**
 * Express middleware validator helper
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
  generateAiInterviewSchema,
  updateQuestionsSchema,
  publishInterviewSchema,
  startInterviewSchema,
  autosaveAnswerSchema,
  releaseFeedbackSchema,
  interviewIdParamSchema,
  questionIdParamSchema,
  jobIdParamSchema,
  validate,
};
