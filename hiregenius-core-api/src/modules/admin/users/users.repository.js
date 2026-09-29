const db = require('../../../config/db');

class AdminUsersRepository {
  async getUserById(id) {
    return db('users')
      .where({ id: Number(id) })
      .first();
  }

  // Recruiter Activity
  async getRecruiterJobCount(recruiterId) {
    const res = await db('jobs')
      .where({ recruiter_id: Number(recruiterId), is_deleted: false })
      .count({ count: '*' })
      .first();
    return Number(res?.count || 0);
  }

  async getRecruiterRecentJobs(recruiterId, limit = 5) {
    const jobs = await db('jobs')
      .where({ recruiter_id: Number(recruiterId), is_deleted: false })
      .select('id', 'title', 'company', 'status', 'created_at')
      .orderBy('created_at', 'desc')
      .limit(limit);

    if (jobs.length === 0) return [];

    const jobIds = jobs.map(j => j.id);
    const counts = await db('applications')
      .whereIn('job_id', jobIds)
      .groupBy('job_id')
      .select('job_id')
      .count({ count: '*' });

    const countsMap = new Map();
    for (const c of counts) {
      countsMap.set(c.job_id, Number(c.count || 0));
    }

    return jobs.map(j => ({
      id: j.id,
      title: j.title,
      company: j.company,
      status: j.status,
      applicationCount: countsMap.get(j.id) || 0,
      createdAt: j.created_at,
    }));
  }

  async getRecruiterTotalApplications(recruiterId) {
    const res = await db('applications')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .where('jobs.recruiter_id', Number(recruiterId))
      .where('jobs.is_deleted', false)
      .count({ count: '*' })
      .first();
    return Number(res?.count || 0);
  }

  // Candidate Activity
  async getCandidateApplicationCount(candidateId) {
    const res = await db('applications')
      .where({ candidate_id: Number(candidateId) })
      .count({ count: '*' })
      .first();
    return Number(res?.count || 0);
  }

  async getCandidateRecentApplications(candidateId, limit = 5) {
    return db('applications')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .where('applications.candidate_id', Number(candidateId))
      .select(
        'applications.id',
        'applications.job_id',
        'jobs.title as job_title',
        'jobs.company',
        'applications.status',
        'applications.applied_at'
      )
      .orderBy('applications.applied_at', 'desc')
      .limit(limit)
      .then(rows => rows.map(r => ({
        id: r.id,
        jobId: r.job_id,
        jobTitle: r.job_title,
        company: r.company,
        status: r.status,
        appliedAt: r.applied_at,
      })));
  }

  async getCandidateProfile(candidateId) {
    return db('candidates')
      .where({ user_id: Number(candidateId) })
      .first();
  }

  // Pre-deletion Safety Checks
  async getRecruiterActiveJobsCount(recruiterId) {
    const res = await db('jobs')
      .where({ recruiter_id: Number(recruiterId), status: 'OPEN', is_deleted: false })
      .count({ count: '*' })
      .first();
    return Number(res?.count || 0);
  }

  async getRecruiterActiveApplicationsCount(recruiterId) {
    const res = await db('applications')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .where('jobs.recruiter_id', Number(recruiterId))
      .where('jobs.is_deleted', false)
      .whereNotIn('applications.status', ['REJECTED', 'HIRED'])
      .count({ count: '*' })
      .first();
    return Number(res?.count || 0);
  }

  async getCandidateActiveApplicationsCount(candidateId) {
    const res = await db('applications')
      .where({ candidate_id: Number(candidateId) })
      .whereNotIn('status', ['REJECTED', 'HIRED'])
      .count({ count: '*' })
      .first();
    return Number(res?.count || 0);
  }

  // Cascade Deletion
  async deleteRecruiterAccount(userId) {
    const uid = Number(userId);
    return db.transaction(async (trx) => {
      // 1. Fetch all job IDs for this recruiter
      const jobs = await trx('jobs').where({ recruiter_id: uid }).select('id');
      const jobIds = jobs.map(j => j.id);

      if (jobIds.length > 0) {
        // 2. Fetch all application IDs for those jobs
        const apps = await trx('applications').whereIn('job_id', jobIds).select('id');
        const appIds = apps.map(a => a.id);

        if (appIds.length > 0) {
          // 3. Delete interviews linked to those applications
          await trx('interviews').whereIn('application_id', appIds).del();
          // 4. Delete notifications referencing those applications
          await trx('notifications')
            .where('related_entity_type', 'APPLICATION')
            .whereIn('related_entity_id', appIds)
            .del();
          // 5. Delete applications
          await trx('applications').whereIn('id', appIds).del();
        }

        // 6. Delete notifications referencing those jobs
        await trx('notifications')
          .where('related_entity_type', 'JOB')
          .whereIn('related_entity_id', jobIds)
          .del();

        // 7. Delete jobs
        await trx('jobs').where({ recruiter_id: uid }).del();
      }

      // 8. Delete recruiter preferences if table exists
      if (await trx.schema.hasTable('recruiter_notification_preferences')) {
        await trx('recruiter_notification_preferences').where({ recruiter_user_id: uid }).del();
      }

      // 9. Delete user notifications, OTPs, and auth tokens
      if (await trx.schema.hasTable('notifications')) {
        await trx('notifications').where({ user_id: uid }).del();
      }
      if (await trx.schema.hasTable('email_otps')) {
        await trx('email_otps').where({ user_id: uid }).del();
      }
      if (await trx.schema.hasTable('email_verification_tokens')) {
        await trx('email_verification_tokens').where({ user_id: uid }).del();
      }
      if (await trx.schema.hasTable('password_reset_tokens')) {
        await trx('password_reset_tokens').where({ user_id: uid }).del();
      }

      // 10. Delete user record
      await trx('users').where({ id: uid }).del();
    });
  }

  async deleteCandidateAccount(userId, candidate) {
    const uid = Number(userId);
    const fs = require('fs');
    const path = require('path');

    await db.transaction(async (trx) => {
      if (candidate?.id) {
        const apps = await trx('applications').where({ candidate_id: candidate.id }).select('id');
        const appIds = apps.map(a => a.id);

        if (appIds.length > 0) {
          await trx('interviews').whereIn('application_id', appIds).del();
          if (await trx.schema.hasTable('notifications')) {
            await trx('notifications')
              .where('related_entity_type', 'APPLICATION')
              .whereIn('related_entity_id', appIds)
              .del();
          }
          await trx('applications').whereIn('id', appIds).del();
        }

        await trx('candidates').where({ id: candidate.id }).del();
      }

      if (await trx.schema.hasTable('notifications')) {
        await trx('notifications').where({ user_id: uid }).del();
      }
      if (await trx.schema.hasTable('email_otps')) {
        await trx('email_otps').where({ user_id: uid }).del();
      }
      if (await trx.schema.hasTable('email_verification_tokens')) {
        await trx('email_verification_tokens').where({ user_id: uid }).del();
      }
      if (await trx.schema.hasTable('password_reset_tokens')) {
        await trx('password_reset_tokens').where({ user_id: uid }).del();
      }
      await trx('users').where({ id: uid }).del();
    });

    // Cleanup physical resume file if present
    if (candidate?.resume_path) {
      try {
        const filePath = path.isAbsolute(candidate.resume_path)
          ? candidate.resume_path
          : path.resolve(process.cwd(), candidate.resume_path);
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }
      } catch (err) {
        console.warn(`[AdminUsers] Could not unlink resume file: ${err.message}`);
      }
    }
  }

  async deleteUserAccount(userId) {
    const uid = Number(userId);
    return db.transaction(async (trx) => {
      if (await trx.schema.hasTable('notifications')) {
        await trx('notifications').where({ user_id: uid }).del();
      }
      if (await trx.schema.hasTable('email_otps')) {
        await trx('email_otps').where({ user_id: uid }).del();
      }
      if (await trx.schema.hasTable('email_verification_tokens')) {
        await trx('email_verification_tokens').where({ user_id: uid }).del();
      }
      if (await trx.schema.hasTable('password_reset_tokens')) {
        await trx('password_reset_tokens').where({ user_id: uid }).del();
      }
      await trx('users').where({ id: uid }).del();
    });
  }
}

module.exports = new AdminUsersRepository();
