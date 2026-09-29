/**
 * Migration: Create platform_settings table and seed singleton row (id = 1)
 */
exports.up = async function (knex) {
  const exists = await knex.schema.hasTable('platform_settings');
  if (!exists) {
    await knex.schema.createTable('platform_settings', (table) => {
      table.increments('id').primary();
      table.string('platform_name', 100).notNullable().defaultTo('HireGenius AI');
      table.string('support_email', 150).notNullable().defaultTo('support@hiregenius.ai');
      table.integer('max_jobs_per_recruiter').notNullable().defaultTo(50);
      table.integer('max_candidates_per_job').notNullable().defaultTo(500);
      table.boolean('ai_resume_screening_enabled').notNullable().defaultTo(false);
      table.boolean('ai_interview_enabled').notNullable().defaultTo(false);
      table.boolean('open_registration_enabled').notNullable().defaultTo(true);
      table.boolean('maintenance_mode_enabled').notNullable().defaultTo(false);
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
      table.bigInteger('updated_by').nullable();
    });

    await knex('platform_settings').insert({
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
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('platform_settings');
};
