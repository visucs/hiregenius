const atsService = require('./ats.service');

class AtsController {
  async scan(req, res, next) {
    try {
      const result = await atsService.scan({
        user: req.user,
        mode: req.body.mode,
        jobId: req.body.job_id || req.body.jobId,
        jobTitle: req.body.job_title || req.body.jobTitle,
        jobDescription: req.body.job_description || req.body.jobDescription,
        file: req.file,
      });

      return res.status(200).json({
        success: true,
        message: 'ATS evaluation completed successfully',
        data: result,
      });
    } catch (err) {
      return next(err);
    }
  }

  async listMyScans(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page || '1', 10));
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)));
      const offset = (page - 1) * limit;

      const { scans, total } = await atsService.getCandidateHistory(req.user.userId, { limit, offset });

      return res.status(200).json({
        success: true,
        message: 'ATS scan history retrieved successfully',
        data: {
          scans,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (err) {
      return next(err);
    }
  }

  async getScanById(req, res, next) {
    try {
      const scan = await atsService.getScanDetail(req.params.id, req.user);
      return res.status(200).json({
        success: true,
        message: 'ATS scan retrieved successfully',
        data: scan,
      });
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new AtsController();
