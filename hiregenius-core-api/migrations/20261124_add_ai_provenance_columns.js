/**
 * Migration: Add AI model provenance columns across core intelligence tables
 * - ats_scans
 * - ai_interview_questions
 * - ai_interview_evaluations
 * - job_rankings
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // 1. ats_scans
  const hasAtsScans = await knex.schema.hasTable('ats_scans');
  if (hasAtsScans) {
    const hasProvider = await knex.schema.hasColumn('ats_scans', 'provider');
    const hasModel = await knex.schema.hasColumn('ats_scans', 'model_version');
    const hasVersion = await knex.schema.hasColumn('ats_scans', 'config_version');
    const hasSource = await knex.schema.hasColumn('ats_scans', 'config_source');

    await knex.schema.alterTable('ats_scans', (table) => {
      if (!hasProvider) table.string('provider', 50).nullable().defaultTo('gemini');
      if (!hasModel) table.string('model_version', 100).nullable().defaultTo('gemini-3.8-flash');
      if (!hasVersion) table.integer('config_version').nullable().defaultTo(1);
      if (!hasSource) table.string('config_source', 20).nullable().defaultTo('db');
    });
  }

  // 2. ai_interview_questions
  const hasQuestions = await knex.schema.hasTable('ai_interview_questions');
  if (hasQuestions) {
    const hasProvider = await knex.schema.hasColumn('ai_interview_questions', 'provider');
    const hasModel = await knex.schema.hasColumn('ai_interview_questions', 'model_version');
    const hasVersion = await knex.schema.hasColumn('ai_interview_questions', 'config_version');
    const hasSource = await knex.schema.hasColumn('ai_interview_questions', 'config_source');

    await knex.schema.alterTable('ai_interview_questions', (table) => {
      if (!hasProvider) table.string('provider', 50).nullable().defaultTo('gemini');
      if (!hasModel) table.string('model_version', 100).nullable().defaultTo('gemini-3.8-flash');
      if (!hasVersion) table.integer('config_version').nullable().defaultTo(1);
      if (!hasSource) table.string('config_source', 20).nullable().defaultTo('db');
    });
  }

  // 3. ai_interview_evaluations
  const hasEvaluations = await knex.schema.hasTable('ai_interview_evaluations');
  if (hasEvaluations) {
    const hasProvider = await knex.schema.hasColumn('ai_interview_evaluations', 'provider');
    const hasVersion = await knex.schema.hasColumn('ai_interview_evaluations', 'config_version');
    const hasSource = await knex.schema.hasColumn('ai_interview_evaluations', 'config_source');

    await knex.schema.alterTable('ai_interview_evaluations', (table) => {
      if (!hasProvider) table.string('provider', 50).nullable().defaultTo('gemini');
      if (!hasVersion) table.integer('config_version').nullable().defaultTo(1);
      if (!hasSource) table.string('config_source', 20).nullable().defaultTo('db');
    });
  }

  // 4. job_rankings
  const hasRankings = await knex.schema.hasTable('job_rankings');
  if (hasRankings) {
    const hasProvider = await knex.schema.hasColumn('job_rankings', 'provider');
    const hasModel = await knex.schema.hasColumn('job_rankings', 'model_version');
    const hasVersion = await knex.schema.hasColumn('job_rankings', 'config_version');
    const hasSource = await knex.schema.hasColumn('job_rankings', 'config_source');

    await knex.schema.alterTable('job_rankings', (table) => {
      if (!hasProvider) table.string('provider', 50).nullable().defaultTo('gemini');
      if (!hasModel) table.string('model_version', 100).nullable().defaultTo('gemini-3.5-flash');
      if (!hasVersion) table.integer('config_version').nullable().defaultTo(1);
      if (!hasSource) table.string('config_source', 20).nullable().defaultTo('db');
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const hasRankings = await knex.schema.hasTable('job_rankings');
  if (hasRankings) {
    await knex.schema.alterTable('job_rankings', (table) => {
      table.dropColumns('provider', 'model_version', 'config_version', 'config_source');
    });
  }

  const hasEvaluations = await knex.schema.hasTable('ai_interview_evaluations');
  if (hasEvaluations) {
    await knex.schema.alterTable('ai_interview_evaluations', (table) => {
      table.dropColumns('provider', 'config_version', 'config_source');
    });
  }

  const hasQuestions = await knex.schema.hasTable('ai_interview_questions');
  if (hasQuestions) {
    await knex.schema.alterTable('ai_interview_questions', (table) => {
      table.dropColumns('provider', 'model_version', 'config_version', 'config_source');
    });
  }

  const hasAtsScans = await knex.schema.hasTable('ats_scans');
  if (hasAtsScans) {
    await knex.schema.alterTable('ats_scans', (table) => {
      table.dropColumns('provider', 'model_version', 'config_version', 'config_source');
    });
  }
};
