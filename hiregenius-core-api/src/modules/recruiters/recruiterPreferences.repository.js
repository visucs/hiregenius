const db = require('../../config/db');

class RecruiterPreferencesRepository {
  async findByRecruiterId(recruiterUserId) {
    const row = await db('recruiter_notification_preferences')
      .where('recruiter_user_id', Number(recruiterUserId))
      .first();

    if (!row) return null;
    return {
      ...row,
      notify_on_new_application: Boolean(row.notify_on_new_application),
      job_alert_dispatch_enabled: Boolean(row.job_alert_dispatch_enabled),
    };
  }

  async createDefault(recruiterUserId) {
    const payload = {
      recruiter_user_id: Number(recruiterUserId),
      notify_on_new_application: false,
      job_alert_dispatch_enabled: true,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    };

    const [id] = await db('recruiter_notification_preferences').insert(payload);
    const created = await db('recruiter_notification_preferences').where('id', id).first();
    return {
      ...created,
      notify_on_new_application: Boolean(created.notify_on_new_application),
      job_alert_dispatch_enabled: Boolean(created.job_alert_dispatch_enabled),
    };
  }

  async update(recruiterUserId, updates) {
    const updateData = {
      ...updates,
      updated_at: db.fn.now(),
    };

    await db('recruiter_notification_preferences')
      .where('recruiter_user_id', Number(recruiterUserId))
      .update(updateData);

    return this.findByRecruiterId(recruiterUserId);
  }
}

module.exports = new RecruiterPreferencesRepository();
