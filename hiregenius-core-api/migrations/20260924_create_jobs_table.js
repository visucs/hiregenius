/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('jobs', (table) => {
    table.increments('id').primary();
    table.bigInteger('recruiter_id').notNullable().index();
    table.string('title', 255).notNullable();
    table.string('company', 255).notNullable();
    table.json('skills').notNullable(); // JSON array storing required skills
    table.string('salary', 100).nullable();
    table.string('experience', 100).nullable();
    table.string('location', 255).nullable();
    table.text('description').notNullable();
    table.enu('status', ['OPEN', 'CLOSED']).defaultTo('OPEN').notNullable().index();
    table.boolean('is_deleted').defaultTo(false).notNullable().index();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('jobs');
};
