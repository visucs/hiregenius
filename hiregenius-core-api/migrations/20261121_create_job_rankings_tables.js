/**
 * Migration: Create job_rankings and job_ranking_items tables
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // 1. job_rankings table (snapshots)
  await knex.schema.createTable('job_rankings', (table) => {
    table.increments('id').primary();
    table.integer('job_id').unsigned().notNullable().references('id').inTable('jobs').onDelete('CASCADE').index();
    table.bigInteger('created_by').notNullable().index();
    table.string('scoring_version', 64).notNullable();
    table.string('embedding_model', 64).notNullable();
    table.integer('applicant_count').notNullable().defaultTo(0);
    table.integer('ranked_count').notNullable().defaultTo(0);
    table.integer('unrankable_count').notNullable().defaultTo(0);
    table.boolean('semantic_unavailable').notNullable().defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable().index();

    table.index(['job_id', 'created_at']);
  });

  // 2. job_ranking_items table (items within a snapshot)
  await knex.schema.createTable('job_ranking_items', (table) => {
    table.increments('id').primary();
    table.integer('ranking_id').unsigned().notNullable().references('id').inTable('job_rankings').onDelete('CASCADE').index();
    table.integer('application_id').unsigned().notNullable().references('id').inTable('applications').onDelete('CASCADE').index();
    table.integer('candidate_id').unsigned().notNullable().references('id').inTable('candidates').onDelete('CASCADE').index();
    table.integer('rank').nullable();
    table.decimal('score', 5, 2).nullable();
    table.text('components', 'long').nullable();
    table.text('matched_skills', 'long').nullable();
    table.text('missing_skills', 'long').nullable();
    table.text('explanation', 'long').nullable();
    table.boolean('rankable').notNullable().defaultTo(true);
    table.text('reason').nullable();

    table.index(['ranking_id', 'rank']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('job_ranking_items');
  await knex.schema.dropTableIfExists('job_rankings');
};
