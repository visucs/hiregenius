const db = require('../../config/db');

class InterviewsRepository {
  async create({ application_id, scheduled_at, meeting_link = null, created_by }) {
    const payload = {
      application_id: Number(application_id),
      scheduled_at: new Date(scheduled_at),
      meeting_link: meeting_link || null,
      status: 'SCHEDULED',
      created_by: Number(created_by),
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    };

    const [id] = await db('interviews').insert(payload);
    return this.findById(id);
  }

  async findById(id) {
    const baseQuery = db('interviews')
      .join('applications', 'interviews.application_id', 'applications.id')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .join('candidates', 'applications.candidate_id', 'candidates.id')
      .where('interviews.id', Number(id))
      .select(
        'interviews.id',
        'interviews.application_id',
        'interviews.scheduled_at',
        'interviews.meeting_link',
        'interviews.status',
        'interviews.created_by',
        'interviews.created_at',
        'interviews.updated_at',
        'applications.status as application_status',
        'jobs.id as job_id',
        'jobs.title as job_title',
        'jobs.company as job_company',
        'jobs.recruiter_id',
        'candidates.id as candidate_id',
        'candidates.user_id as candidate_user_id',
      );

    try {
      const row = await baseQuery
        .clone()
        .leftJoin('users as candidate_user', 'candidates.user_id', 'candidate_user.id')
        .leftJoin('users as recruiter_user', 'interviews.created_by', 'recruiter_user.id')
        .select(
          'candidate_user.name as candidate_name',
          'candidate_user.email as candidate_email',
          'recruiter_user.name as recruiter_name',
          'recruiter_user.email as recruiter_email',
        )
        .first();

      return row || null;
    } catch {
      const row = await baseQuery.first();
      return row || null;
    }
  }

  async findByApplicationId(applicationId) {
    return db('interviews')
      .where('application_id', Number(applicationId))
      .first();
  }

  async findByRecruiter(recruiterId, { status, page = 1, limit = 20 } = {}) {
    const baseQuery = db('interviews')
      .join('applications', 'interviews.application_id', 'applications.id')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .join('candidates', 'applications.candidate_id', 'candidates.id')
      .where(function () {
        this.where('interviews.created_by', Number(recruiterId))
          .orWhere('jobs.recruiter_id', Number(recruiterId));
      });

    if (status) {
      baseQuery.andWhere('interviews.status', status);
    }

    const [{ count }] = await baseQuery.clone().count('interviews.id as count');
    const total = Number(count);
    const offset = (page - 1) * limit;

    const selectQuery = baseQuery
      .clone()
      .select(
        'interviews.id',
        'interviews.application_id',
        'interviews.scheduled_at',
        'interviews.meeting_link',
        'interviews.status',
        'interviews.created_by',
        'interviews.created_at',
        'interviews.updated_at',
        'applications.status as application_status',
        'jobs.id as job_id',
        'jobs.title as job_title',
        'jobs.company as job_company',
        'jobs.recruiter_id',
        'candidates.id as candidate_id',
        'candidates.user_id as candidate_user_id',
      )
      .orderBy('interviews.scheduled_at', 'asc')
      .offset(offset)
      .limit(limit);

    let rows;
    try {
      rows = await selectQuery
        .clone()
        .leftJoin('users as candidate_user', 'candidates.user_id', 'candidate_user.id')
        .select(
          'candidate_user.name as candidate_name',
          'candidate_user.email as candidate_email',
        );
    } catch {
      rows = await selectQuery;
    }

    return {
      interviews: rows,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findByCandidate(candidateUserId) {
    const baseQuery = db('interviews')
      .join('applications', 'interviews.application_id', 'applications.id')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .join('candidates', 'applications.candidate_id', 'candidates.id')
      .where('candidates.user_id', Number(candidateUserId))
      .select(
        'interviews.id',
        'interviews.application_id',
        'interviews.scheduled_at',
        'interviews.meeting_link',
        'interviews.status',
        'interviews.created_by',
        'interviews.created_at',
        'interviews.updated_at',
        'jobs.id as job_id',
        'jobs.title as job_title',
        'jobs.company as job_company',
      )
      .orderBy('interviews.scheduled_at', 'asc');

    return baseQuery;
  }

  async update(id, data) {
    const updateData = {
      ...data,
      updated_at: db.fn.now(),
    };

    await db('interviews')
      .where('id', Number(id))
      .update(updateData);

    return this.findById(id);
  }
}

module.exports = new InterviewsRepository();
