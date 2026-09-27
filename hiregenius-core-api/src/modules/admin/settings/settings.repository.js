const db = require('../../../config/db');

function formatSettings(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    platformName: row.platform_name,
    supportEmail: row.support_email,
    maxJobsPerRecruiter: Number(row.max_jobs_per_recruiter),
    maxCandidatesPerJob: Number(row.max_candidates_per_job),
    aiResumeScreeningEnabled: Boolean(row.ai_resume_screening_enabled),
    aiInterviewEnabled: Boolean(row.ai_interview_enabled),
    openRegistrationEnabled: Boolean(row.open_registration_enabled),
    maintenanceModeEnabled: Boolean(row.maintenance_mode_enabled),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by ? Number(row.updated_by) : null,
  };
}

class SettingsRepository {
  async getSettings() {
    let row = await db('platform_settings').where('id', 1).first();
    if (!row) {
      await db('platform_settings').insert({
        id: 1,
        platform_name: 'HireGenius AI',
        support_email: 'support@hiregenius.ai',
        max_jobs_per_recruiter: 50,
        max_candidates_per_job: 500,
        ai_resume_screening_enabled: false,
        ai_interview_enabled: false,
        open_registration_enabled: true,
        maintenance_mode_enabled: false,
      });
      row = await db('platform_settings').where('id', 1).first();
    }
    return formatSettings(row);
  }

  async updateSettings(updates, updatedBy = null) {
    const dbPayload = {
      updated_at: db.fn.now(),
    };

    if (updatedBy !== null && updatedBy !== undefined) {
      dbPayload.updated_by = Number(updatedBy);
    }

    if (updates.platformName !== undefined) dbPayload.platform_name = updates.platformName;
    if (updates.supportEmail !== undefined) dbPayload.support_email = updates.supportEmail;
    if (updates.maxJobsPerRecruiter !== undefined) dbPayload.max_jobs_per_recruiter = updates.maxJobsPerRecruiter;
    if (updates.maxCandidatesPerJob !== undefined) dbPayload.max_candidates_per_job = updates.maxCandidatesPerJob;
    if (updates.aiResumeScreeningEnabled !== undefined) dbPayload.ai_resume_screening_enabled = updates.aiResumeScreeningEnabled;
    if (updates.aiInterviewEnabled !== undefined) dbPayload.ai_interview_enabled = updates.aiInterviewEnabled;
    if (updates.openRegistrationEnabled !== undefined) dbPayload.open_registration_enabled = updates.openRegistrationEnabled;
    if (updates.maintenanceModeEnabled !== undefined) dbPayload.maintenance_mode_enabled = updates.maintenanceModeEnabled;

    await db('platform_settings').where('id', 1).update(dbPayload);
    return this.getSettings();
  }
}

module.exports = new SettingsRepository();
