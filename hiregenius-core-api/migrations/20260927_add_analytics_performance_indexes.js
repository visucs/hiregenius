/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // 1. Index jobs.created_at for date-window filtering in analytics
  const hasJobsTable = await knex.schema.hasTable('jobs');
  if (hasJobsTable) {
    await knex.schema.alterTable('jobs', (table) => {
      table.index(['created_at'], 'idx_jobs_created_at');
    });
  }

  // 2. Index applications.applied_at and candidate_id for analytics queries
  const hasApplicationsTable = await knex.schema.hasTable('applications');
  if (hasApplicationsTable) {
    await knex.schema.alterTable('applications', (table) => {
      table.index(['applied_at'], 'idx_applications_applied_at');
      table.index(['candidate_id'], 'idx_applications_candidate_id');
    });
  }

  // 3. Index interviews.created_at for interview date aggregation
  const hasInterviewsTable = await knex.schema.hasTable('interviews');
  if (hasInterviewsTable) {
    await knex.schema.alterTable('interviews', (table) => {
      table.index(['created_at'], 'idx_interviews_created_at');
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const hasInterviewsTable = await knex.schema.hasTable('interviews');
  if (hasInterviewsTable) {
    await knex.schema.alterTable('interviews', (table) => {
      table.dropIndex(['created_at'], 'idx_interviews_created_at');
    });
  }

  const hasApplicationsTable = await knex.schema.hasTable('applications');
  if (hasApplicationsTable) {
    await knex.schema.alterTable('applications', (table) => {
      table.dropIndex(['applied_at'], 'idx_applications_applied_at');
      table.dropIndex(['candidate_id'], 'idx_applications_candidate_id');
    });
  }

  const hasJobsTable = await knex.schema.hasTable('jobs');
  if (hasJobsTable) {
    await knex.schema.alterTable('jobs', (table) => {
      table.dropIndex(['created_at'], 'idx_jobs_created_at');
    });
  }
};
