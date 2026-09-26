/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // 1. Add job_alerts_opt_in to candidates table if not present
  const hasJobAlertsColumn = await knex.schema.hasColumn('candidates', 'job_alerts_opt_in');
  if (!hasJobAlertsColumn) {
    await knex.schema.alterTable('candidates', (table) => {
      table.boolean('job_alerts_opt_in').defaultTo(true).notNullable().index();
    });
  }

  // 2. Create recruiter_notification_preferences table
  const hasPrefsTable = await knex.schema.hasTable('recruiter_notification_preferences');
  if (!hasPrefsTable) {
    await knex.schema.createTable('recruiter_notification_preferences', (table) => {
      table.increments('id').primary();
      table.bigInteger('recruiter_user_id').notNullable().unique().index();
      table.boolean('notify_on_new_application').defaultTo(false).notNullable();
      table.boolean('job_alert_dispatch_enabled').defaultTo(true).notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
      table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('recruiter_notification_preferences');

  const hasJobAlertsColumn = await knex.schema.hasColumn('candidates', 'job_alerts_opt_in');
  if (hasJobAlertsColumn) {
    await knex.schema.alterTable('candidates', (table) => {
      table.dropColumn('job_alerts_opt_in');
    });
  }
};
