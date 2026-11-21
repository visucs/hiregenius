/**
 * Migration: Create AI Interviews tables (Phase 7)
 * - ai_interviews: Session lifecycle, time window, countdown timer, consent timestamp, feedback flag
 * - ai_interview_questions: Curated questions, difficulty, expected criteria
 * - ai_interview_answers: Candidate answers, autosaves, character lengths
 * - ai_interview_evaluations: Structured rubric scores, evidence quotes, advisory recommendations
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // 1. ai_interviews
  await knex.schema.createTable('ai_interviews', (table) => {
    table.increments('id').primary();
    table.integer('application_id').unsigned().notNullable()
      .references('id').inTable('applications').onDelete('CASCADE');
    table.string('status', 30).notNullable().defaultTo('DRAFT').index();
    table.dateTime('window_start').notNullable();
    table.dateTime('window_end').notNullable();
    table.integer('duration_minutes').notNullable().defaultTo(30);
    table.dateTime('started_at').nullable();
    table.dateTime('submitted_at').nullable();
    table.dateTime('acknowledged_at').nullable(); // Mandatory Consent Acknowledgment timestamp
    table.boolean('feedback_released').notNullable().defaultTo(false);
    table.bigInteger('created_by').notNullable().index(); // Recruiter user id
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable().index();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    table.index(['application_id']);
    table.index(['status', 'window_end']);
    table.index(['created_by', 'created_at']);
  });

  // 2. ai_interview_questions
  await knex.schema.createTable('ai_interview_questions', (table) => {
    table.increments('id').primary();
    table.integer('interview_id').unsigned().notNullable()
      .references('id').inTable('ai_interviews').onDelete('CASCADE');
    table.integer('question_order').notNullable().defaultTo(1);
    table.string('type', 30).notNullable(); // TECHNICAL, BEHAVIORAL, RESUME_PROBE, SCENARIO
    table.text('text').notNullable();
    table.text('skill_tags').nullable(); // JSON array string
    table.string('difficulty', 20).notNullable().defaultTo('MEDIUM');
    table.text('expected_points').nullable(); // JSON array string (RESTRICTED: Never returned to candidate)
    table.integer('max_score').notNullable().defaultTo(10);
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();

    table.index(['interview_id', 'question_order']);
  });

  // 3. ai_interview_answers
  await knex.schema.createTable('ai_interview_answers', (table) => {
    table.increments('id').primary();
    table.integer('interview_id').unsigned().notNullable()
      .references('id').inTable('ai_interviews').onDelete('CASCADE');
    table.integer('question_id').unsigned().notNullable()
      .references('id').inTable('ai_interview_questions').onDelete('CASCADE');
    table.text('answer_text').nullable();
    table.integer('char_count').notNullable().defaultTo(0);
    table.dateTime('submitted_at').nullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    table.unique(['interview_id', 'question_id']);
    table.index(['interview_id']);
  });

  // 4. ai_interview_evaluations
  await knex.schema.createTable('ai_interview_evaluations', (table) => {
    table.increments('id').primary();
    table.integer('interview_id').unsigned().notNullable().unique()
      .references('id').inTable('ai_interviews').onDelete('CASCADE');
    table.string('evaluation_status', 20).notNullable().defaultTo('PENDING').index(); // PENDING, EVALUATED, FAILED
    table.decimal('overall_score', 5, 2).nullable();
    table.decimal('technical_score', 5, 2).nullable();
    table.decimal('communication_score', 5, 2).nullable();
    table.decimal('confidence_score', 5, 2).nullable();
    table.string('recommendation', 30).nullable(); // PROCEED, CONSIDER, NOT_A_FIT
    table.string('rubric_version', 50).defaultTo('rubric-v1-untuned').notNullable();
    table.string('model_version', 50).nullable();
    table.text('result_json', 'long').nullable();
    table.text('error_message').nullable();
    table.dateTime('evaluated_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('ai_interview_evaluations');
  await knex.schema.dropTableIfExists('ai_interview_answers');
  await knex.schema.dropTableIfExists('ai_interview_questions');
  await knex.schema.dropTableIfExists('ai_interviews');
};
