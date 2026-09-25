const db = require('../../config/db');

class ApplicationsRepository {
  async create({ job_id, candidate_id, status = 'APPLIED' }) {
    const payload = {
      job_id: Number(job_id),
      candidate_id: Number(candidate_id),
      status,
      applied_at: db.fn.now(),
      updated_at: db.fn.now(),
    };

    const [id] = await db('applications').insert(payload);
    return this.findById(id);
  }

  async findById(id) {
    const baseQuery = db('applications')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .join('candidates', 'applications.candidate_id', 'candidates.id')
      .where('applications.id', Number(id))
      .select(
        'applications.id',
        'applications.job_id',
        'applications.candidate_id',
        'applications.status',
        'applications.applied_at',
        'applications.updated_at',
        'jobs.title as job_title',
        'jobs.company as job_company',
        'jobs.location as job_location',
        'jobs.status as job_status',
        'jobs.recruiter_id as recruiter_id',
        'candidates.user_id as candidate_user_id',
        'candidates.resume_path',
        'candidates.resume_original_name',
      );

    try {
      // Left join users table for both candidate and recruiter
      const row = await baseQuery
        .clone()
        .leftJoin('users as candidate_user', 'candidates.user_id', 'candidate_user.id')
        .leftJoin('users as recruiter_user', 'jobs.recruiter_id', 'recruiter_user.id')
        .select(
          'candidate_user.name as candidate_name',
          'candidate_user.email as candidate_email',
          'recruiter_user.name as recruiter_name',
          'recruiter_user.email as recruiter_email',
        )
        .first();

      return row || null;
    } catch {
      // Fallback for isolated test databases where users table is not present
      const row = await baseQuery.first();
      return row || null;
    }
  }

  async findByJobAndCandidate(jobId, candidateId) {
    return db('applications')
      .where({
        job_id: Number(jobId),
        candidate_id: Number(candidateId),
      })
      .first();
  }

  async findByCandidate(candidateId) {
    const baseQuery = db('applications')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .where('applications.candidate_id', Number(candidateId))
      .select(
        'applications.id',
        'applications.job_id',
        'applications.candidate_id',
        'applications.status',
        'applications.applied_at',
        'applications.updated_at',
        'jobs.title as job_title',
        'jobs.company as job_company',
        'jobs.location as job_location',
        'jobs.status as job_status',
        'jobs.recruiter_id as recruiter_id',
      )
      .orderBy('applications.applied_at', 'desc');

    try {
      return await baseQuery
        .clone()
        .leftJoin('users as recruiter_user', 'jobs.recruiter_id', 'recruiter_user.id')
        .select(
          'recruiter_user.name as recruiter_name',
          'recruiter_user.email as recruiter_email',
        );
    } catch {
      return baseQuery;
    }
  }

  async findByJob(jobId) {
    const baseQuery = db('applications')
      .join('candidates', 'applications.candidate_id', 'candidates.id')
      .where('applications.job_id', Number(jobId))
      .select(
        'applications.id',
        'applications.job_id',
        'applications.candidate_id',
        'applications.status',
        'applications.applied_at',
        'applications.updated_at',
        'candidates.user_id as candidate_user_id',
        'candidates.resume_path',
        'candidates.resume_original_name',
      )
      .orderBy('applications.applied_at', 'desc');

    try {
      // Attempt read-only join with Auth Service users table for name & email
      return await baseQuery
        .clone()
        .leftJoin('users', 'candidates.user_id', 'users.id')
        .select('users.name as candidate_name', 'users.email as candidate_email');
    } catch {
      // Fallback if users table is not present in isolated test environments
      return baseQuery;
    }
  }

  async updateStatus(id, status) {
    await db('applications')
      .where('id', Number(id))
      .update({
        status,
        updated_at: db.fn.now(),
      });

    return this.findById(id);
  }
}

module.exports = new ApplicationsRepository();
