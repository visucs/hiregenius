/**
 * Migration: Create admin_step_up_tokens and admin_step_up_lockouts tables
 * Used for short-lived, action-bound, single-use step-up authorization for AI configuration.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // 1. Single-use step-up tokens table
  const hasTokensTable = await knex.schema.hasTable('admin_step_up_tokens');
  if (!hasTokensTable) {
    await knex.schema.createTable('admin_step_up_tokens', (table) => {
      table.string('jti', 64).primary();
      table.bigInteger('admin_id').notNullable().index();
      table.string('action_type', 64).notNullable();
      table.dateTime('expires_at').notNullable().index();
      table.dateTime('consumed_at').nullable().index();
      table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();

      table.index(['admin_id', 'action_type']);
    });
  }

  // 2. Step-up failed attempt lockouts table (isolated to step-up endpoint only)
  const hasLockoutsTable = await knex.schema.hasTable('admin_step_up_lockouts');
  if (!hasLockoutsTable) {
    await knex.schema.createTable('admin_step_up_lockouts', (table) => {
      table.bigInteger('admin_id').primary();
      table.integer('failed_attempts').defaultTo(0).notNullable();
      table.dateTime('locked_until').nullable();
      table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('admin_step_up_lockouts');
  await knex.schema.dropTableIfExists('admin_step_up_tokens');
};
