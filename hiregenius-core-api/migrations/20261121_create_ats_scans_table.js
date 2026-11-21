/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('ats_scans', (table) => {
    table.increments('id').primary();
    table.bigInteger('candidate_user_id').notNullable().index();
    table.bigInteger('triggered_by_user_id').notNullable().index();
    table.string('triggered_by_role', 50).notNullable();
    table.integer('job_id').unsigned().nullable();
    table.string('mode', 20).notNullable(); // GENERAL or JOB
    table.string('source', 20).notNullable(); // PROFILE or UPLOAD
    table.decimal('overall_score', 5, 2).notNullable();
    table.string('scoring_version', 50).defaultTo('ats-v2-untuned').notNullable();
    table.text('result_json', 'long').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable().index();

    table.index(['candidate_user_id', 'created_at']);
    table.index(['triggered_by_user_id', 'created_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('ats_scans');
};
