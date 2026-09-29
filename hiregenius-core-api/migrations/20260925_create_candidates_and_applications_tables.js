/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // 1. candidates table
  await knex.schema.createTable('candidates', (table) => {
    table.increments('id').primary();
    table.bigInteger('user_id').notNullable().unique().index();
    table.string('resume_path', 500).nullable();
    table.string('resume_original_name', 255).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
  });

  // 2. applications table
  await knex.schema.createTable('applications', (table) => {
    table.increments('id').primary();
    table.integer('job_id').unsigned().notNullable().references('id').inTable('jobs').onDelete('CASCADE');
    table.integer('candidate_id').unsigned().notNullable().references('id').inTable('candidates').onDelete('CASCADE');
    table.enu('status', ['APPLIED', 'SCREENING', 'INTERVIEW', 'SHORTLISTED', 'REJECTED', 'HIRED'])
      .defaultTo('APPLIED')
      .notNullable()
      .index();
    table.timestamp('applied_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    // Unique constraint: a candidate cannot apply to the same job twice
    table.unique(['job_id', 'candidate_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('applications');
  await knex.schema.dropTableIfExists('candidates');
};
