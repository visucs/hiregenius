const express = require('express');
const aiInterviewsController = require('./aiInterviews.controller');
const verifyJwt = require('../../middleware/verifyJwt');
const requireRole = require('../../middleware/requireRole');
const {
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
} = require('./aiInterviews.validation');

const router = express.Router();
const candidatesAiInterviewsRouter = express.Router();
const jobsAiInterviewsRouter = express.Router();

// ==========================================
// Candidate Routes (/api/candidates)
// ==========================================
candidatesAiInterviewsRouter.get(
  '/me/ai-interviews',
  verifyJwt,
  requireRole('CANDIDATE'),
  (req, res, next) => aiInterviewsController.getCandidateInterviews(req, res, next)
);

// ==========================================
// Job AI Interviews (/api/jobs/:jobId/ai-interviews)
// ==========================================
jobsAiInterviewsRouter.get(
  '/:jobId/ai-interviews',
  verifyJwt,
  requireRole('RECRUITER'),
  validate(jobIdParamSchema, 'params'),
  (req, res, next) => aiInterviewsController.getJobInterviews(req, res, next)
);

// ==========================================
// Candidate Room Endpoints (/api/ai-interviews)
// ==========================================
router.get(
  '/:id/room',
  verifyJwt,
  requireRole('CANDIDATE'),
  validate(interviewIdParamSchema, 'params'),
  (req, res, next) => aiInterviewsController.getRoom(req, res, next)
);

router.post(
  '/:id/start',
  verifyJwt,
  requireRole('CANDIDATE'),
  validate(interviewIdParamSchema, 'params'),
  validate(startInterviewSchema, 'body'),
  (req, res, next) => aiInterviewsController.start(req, res, next)
);

router.post(
  '/:id/questions/:questionId/answer',
  verifyJwt,
  requireRole('CANDIDATE'),
  validate(questionIdParamSchema, 'params'),
  validate(autosaveAnswerSchema, 'body'),
  (req, res, next) => aiInterviewsController.autosaveAnswer(req, res, next)
);

router.post(
  '/:id/submit',
  verifyJwt,
  requireRole('CANDIDATE'),
  validate(interviewIdParamSchema, 'params'),
  (req, res, next) => aiInterviewsController.submit(req, res, next)
);

// ==========================================
// Recruiter Management Endpoints (/api/ai-interviews)
// ==========================================
router.post(
  '/generate',
  verifyJwt,
  requireRole('RECRUITER'),
  validate(generateAiInterviewSchema, 'body'),
  (req, res, next) => aiInterviewsController.generate(req, res, next)
);

router.get(
  '/:id',
  verifyJwt,
  requireRole('RECRUITER'),
  validate(interviewIdParamSchema, 'params'),
  (req, res, next) => aiInterviewsController.getDetail(req, res, next)
);

router.put(
  '/:id/questions',
  verifyJwt,
  requireRole('RECRUITER'),
  validate(interviewIdParamSchema, 'params'),
  validate(updateQuestionsSchema, 'body'),
  (req, res, next) => aiInterviewsController.updateQuestions(req, res, next)
);

router.post(
  '/:id/publish',
  verifyJwt,
  requireRole('RECRUITER'),
  validate(interviewIdParamSchema, 'params'),
  validate(publishInterviewSchema, 'body'),
  (req, res, next) => aiInterviewsController.publish(req, res, next)
);

router.post(
  '/:id/cancel',
  verifyJwt,
  requireRole('RECRUITER'),
  validate(interviewIdParamSchema, 'params'),
  (req, res, next) => aiInterviewsController.cancel(req, res, next)
);

router.post(
  '/:id/release-feedback',
  verifyJwt,
  requireRole('RECRUITER'),
  validate(interviewIdParamSchema, 'params'),
  validate(releaseFeedbackSchema, 'body'),
  (req, res, next) => aiInterviewsController.releaseFeedback(req, res, next)
);

router.post(
  '/:id/evaluation/retry',
  verifyJwt,
  requireRole('RECRUITER'),
  validate(interviewIdParamSchema, 'params'),
  (req, res, next) => aiInterviewsController.retryEvaluation(req, res, next)
);

router.post(
  '/:id/reset',
  verifyJwt,
  requireRole('RECRUITER'),
  validate(interviewIdParamSchema, 'params'),
  (req, res, next) => aiInterviewsController.reset(req, res, next)
);

module.exports = router;
module.exports.candidatesAiInterviewsRouter = candidatesAiInterviewsRouter;
module.exports.jobsAiInterviewsRouter = jobsAiInterviewsRouter;
