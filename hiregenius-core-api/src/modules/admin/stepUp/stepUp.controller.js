const stepUpService = require('./stepUp.service');

/**
 * Controller to handle administrator step-up password verification.
 */
async function createStepUpToken(req, res, next) {
  try {
    const { password, action_type } = req.body;
    const result = await stepUpService.verifyPasswordAndIssueToken(
      req.user.userId,
      password,
      action_type
    );
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createStepUpToken,
};
