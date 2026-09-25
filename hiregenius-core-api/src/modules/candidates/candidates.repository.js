const db = require('../../config/db');

class CandidatesRepository {
  async findByUserId(userId) {
    const candidate = await db('candidates')
      .where('user_id', Number(userId))
      .first();
    if (!candidate) return null;

    let candidate_name = null;
    let candidate_email = null;

    try {
      const user = await db('users').where('id', Number(userId)).first('name', 'email');
      if (user) {
        candidate_name = user.name || null;
        candidate_email = user.email || null;
      }
    } catch {
      // test fallback
    }

    return {
      ...candidate,
      candidate_name,
      candidate_email,
    };
  }

  async findById(id) {
    return db('candidates')
      .where('id', Number(id))
      .first();
  }

  async create({ user_id, resume_path, resume_original_name }) {
    const payload = {
      user_id: Number(user_id),
      resume_path,
      resume_original_name,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    };

    const [id] = await db('candidates').insert(payload);
    return this.findById(id);
  }

  async updateResume(id, { resume_path, resume_original_name }) {
    await db('candidates')
      .where('id', Number(id))
      .update({
        resume_path,
        resume_original_name,
        updated_at: db.fn.now(),
      });

    return this.findById(id);
  }

  /**
   * Verify if candidate has at least one application to a job owned by recruiterId
   */
  async hasApplicationToRecruiter(candidateId, recruiterId) {
    const row = await db('applications')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .where('applications.candidate_id', Number(candidateId))
      .andWhere('jobs.recruiter_id', Number(recruiterId))
      .andWhere('jobs.is_deleted', false)
      .first('applications.id');

    return Boolean(row);
  }

  /**
   * Return candidate detail with read-only user info (name, email) if users table exists
   */
  async findDetailWithUser(candidateId) {
    const candidate = await this.findById(candidateId);
    if (!candidate) return null;

    let candidate_name = null;
    let candidate_email = null;

    try {
      const user = await db('users')
        .where('id', candidate.user_id)
        .first('name', 'email');

      if (user) {
        candidate_name = user.name || null;
        candidate_email = user.email || null;
      }
    } catch {
      // In isolated test environments where users table might not be seeded
    }

    return {
      ...candidate,
      candidate_name,
      candidate_email,
    };
  }
}

module.exports = new CandidatesRepository();
