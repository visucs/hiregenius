const db = require('../../config/db');

function formatJob(row) {
  if (!row) return null;

  let skills = row.skills;
  if (typeof skills === 'string') {
    try {
      skills = JSON.parse(skills);
    } catch {
      skills = [];
    }
  }

  return {
    ...row,
    skills,
    is_deleted: Boolean(row.is_deleted),
  };
}

class JobsRepository {
  async create(jobData) {
    const payload = {
      recruiter_id: jobData.recruiter_id,
      title: jobData.title,
      company: jobData.company,
      skills: JSON.stringify(jobData.skills),
      salary: jobData.salary || null,
      experience: jobData.experience || null,
      location: jobData.location || null,
      description: jobData.description,
      status: jobData.status || 'OPEN',
      is_deleted: false,
    };

    const [id] = await db('jobs').insert(payload);
    return this.findById(id);
  }

  async findById(id, includeDeleted = false) {
    const query = db('jobs').where('jobs.id', id);
    if (!includeDeleted) {
      query.andWhere('jobs.is_deleted', false);
    }

    try {
      const row = await query
        .clone()
        .leftJoin('users', 'jobs.recruiter_id', 'users.id')
        .select('jobs.*', 'users.name as recruiter_name', 'users.email as recruiter_email')
        .first();
      return formatJob(row);
    } catch {
      const row = await query.first();
      return formatJob(row);
    }
  }

  async findPublicJobs({ page = 1, limit = 10, title, company, location } = {}) {
    const baseQuery = db('jobs').where({
      'jobs.status': 'OPEN',
      'jobs.is_deleted': false,
    });

    if (title) {
      baseQuery.andWhere('jobs.title', 'like', `%${title}%`);
    }
    if (company) {
      baseQuery.andWhere('jobs.company', 'like', `%${company}%`);
    }
    if (location) {
      baseQuery.andWhere('jobs.location', 'like', `%${location}%`);
    }

    const [{ count }] = await baseQuery.clone().count('jobs.id as count');
    const total = Number(count);

    const offset = (page - 1) * limit;
    let rows;
    try {
      rows = await baseQuery
        .clone()
        .leftJoin('users', 'jobs.recruiter_id', 'users.id')
        .select('jobs.*', 'users.name as recruiter_name', 'users.email as recruiter_email')
        .orderBy('jobs.created_at', 'desc')
        .offset(offset)
        .limit(limit);
    } catch {
      rows = await baseQuery
        .clone()
        .select('jobs.*')
        .orderBy('jobs.created_at', 'desc')
        .offset(offset)
        .limit(limit);
    }

    return {
      jobs: rows.map(formatJob),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findByRecruiter(recruiterId, { page = 1, limit = 10 } = {}) {
    const baseQuery = db('jobs').where({
      recruiter_id: recruiterId,
      is_deleted: false,
    });

    const [{ count }] = await baseQuery.clone().count('id as count');
    const total = Number(count);

    const offset = (page - 1) * limit;
    const rows = await baseQuery
      .clone()
      .orderBy('created_at', 'desc')
      .offset(offset)
      .limit(limit);

    return {
      jobs: rows.map(formatJob),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async update(id, updateData) {
    const payload = {
      updated_at: db.fn.now(),
    };

    if (updateData.title !== undefined) payload.title = updateData.title;
    if (updateData.company !== undefined) payload.company = updateData.company;
    if (updateData.skills !== undefined) payload.skills = JSON.stringify(updateData.skills);
    if (updateData.salary !== undefined) payload.salary = updateData.salary;
    if (updateData.experience !== undefined) payload.experience = updateData.experience;
    if (updateData.location !== undefined) payload.location = updateData.location;
    if (updateData.description !== undefined) payload.description = updateData.description;
    if (updateData.status !== undefined) payload.status = updateData.status;

    await db('jobs').where('id', id).andWhere('is_deleted', false).update(payload);
    return this.findById(id);
  }

  async updateStatus(id, status) {
    await db('jobs')
      .where('id', id)
      .andWhere('is_deleted', false)
      .update({
        status,
        updated_at: db.fn.now(),
      });

    return this.findById(id);
  }

  async softDelete(id) {
    const updated = await db('jobs')
      .where('id', id)
      .andWhere('is_deleted', false)
      .update({
        is_deleted: true,
        updated_at: db.fn.now(),
      });

    return updated > 0;
  }
}

module.exports = new JobsRepository();
