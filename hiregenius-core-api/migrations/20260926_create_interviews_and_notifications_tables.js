/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // 1. interviews table
  await knex.schema.createTable('interviews', (table) => {
    table.increments('id').primary();
    table.integer('application_id').unsigned().notNullable().unique().references('id').inTable('applications').onDelete('CASCADE');
    table.dateTime('scheduled_at').notNullable();
    table.string('meeting_link', 1024).nullable();
    table.enu('status', ['SCHEDULED', 'COMPLETED', 'CANCELLED'])
      .defaultTo('SCHEDULED')
      .notNullable()
      .index();
    table.bigInteger('created_by').notNullable().index();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
  });

  // 2. notifications table
  await knex.schema.createTable('notifications', (table) => {
    table.increments('id').primary();
    table.bigInteger('user_id').notNullable().index();
    table.enu('type', [
      'APPLICATION_RECEIVED',
      'INTERVIEW_SCHEDULED',
      'INTERVIEW_CANCELLED',
      'STATUS_CHANGED',
    ]).notNullable().index();
    table.text('message').notNullable();
    table.string('related_entity_type', 64).nullable().index();
    table.integer('related_entity_id').unsigned().nullable().index();
    table.boolean('is_read').defaultTo(false).notNullable().index();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('interviews');
};
