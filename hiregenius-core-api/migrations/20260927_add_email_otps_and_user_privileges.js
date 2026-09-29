/**
 * Migration: Create email_otps table and add admin_approved, can_post_jobs, can_apply_to_jobs to users
 */
exports.up = async function (knex) {
  const hasEmailOtps = await knex.schema.hasTable('email_otps');
  if (!hasEmailOtps) {
    await knex.schema.createTable('email_otps', (table) => {
      table.bigIncrements('id').primary();
      table.bigInteger('user_id').notNullable();
      table.string('otp_hash', 255).notNullable();
      table.string('purpose', 50).notNullable().defaultTo('EMAIL_VERIFICATION');
      table.timestamp('expires_at').notNullable();
      table.boolean('used').notNullable().defaultTo(false);
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.index(['user_id'], 'idx_email_otps_user_id');
      table.index(['purpose'], 'idx_email_otps_purpose');
    });
  }

  const hasUsersTable = await knex.schema.hasTable('users');
  if (hasUsersTable) {
    const hasAdminApproved = await knex.schema.hasColumn('users', 'admin_approved');
    const hasCanPostJobs = await knex.schema.hasColumn('users', 'can_post_jobs');
    const hasCanApplyToJobs = await knex.schema.hasColumn('users', 'can_apply_to_jobs');

    await knex.schema.alterTable('users', (table) => {
      if (!hasAdminApproved) {
        table.boolean('admin_approved').notNullable().defaultTo(false);
      }
      if (!hasCanPostJobs) {
        table.boolean('can_post_jobs').notNullable().defaultTo(true);
      }
      if (!hasCanApplyToJobs) {
        table.boolean('can_apply_to_jobs').notNullable().defaultTo(true);
      }
    });

    await knex('users').where({ role: 'ADMIN' }).update({ admin_approved: true });
    await knex('users').update({ can_post_jobs: true, can_apply_to_jobs: true });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('email_otps');

  const hasUsersTable = await knex.schema.hasTable('users');
  if (hasUsersTable) {
    await knex.schema.alterTable('users', (table) => {
      table.dropColumn('admin_approved');
      table.dropColumn('can_post_jobs');
      table.dropColumn('can_apply_to_jobs');
    });
  }
};
