const db = require('../../config/db');

class NotificationsRepository {
  async create({ user_id, type, message, related_entity_type = null, related_entity_id = null }) {
    const payload = {
      user_id: Number(user_id),
      type,
      message,
      related_entity_type,
      related_entity_id: related_entity_id ? Number(related_entity_id) : null,
      is_read: false,
      created_at: db.fn.now(),
    };

    const [id] = await db('notifications').insert(payload);
    return this.findById(id);
  }

  async findById(id) {
    const row = await db('notifications')
      .where('id', Number(id))
      .first();

    if (!row) return null;
    return {
      ...row,
      is_read: Boolean(row.is_read),
    };
  }

  async findByUser(userId, { isRead = undefined, page = 1, limit = 20 } = {}) {
    const baseQuery = db('notifications').where('user_id', Number(userId));

    if (typeof isRead === 'boolean') {
      baseQuery.andWhere('is_read', isRead);
    }

    const [{ count }] = await baseQuery.clone().count('id as count');
    const total = Number(count);
    const offset = (page - 1) * limit;

    const rows = await baseQuery
      .clone()
      .orderBy('created_at', 'desc')
      .offset(offset)
      .limit(limit);

    return {
      notifications: rows.map((r) => ({
        ...r,
        is_read: Boolean(r.is_read),
      })),
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async markAsRead(id) {
    await db('notifications')
      .where('id', Number(id))
      .update({ is_read: true });

    return this.findById(id);
  }

  async markAllAsRead(userId) {
    const updatedCount = await db('notifications')
      .where('user_id', Number(userId))
      .andWhere('is_read', false)
      .update({ is_read: true });

    return { updatedCount };
  }
}

module.exports = new NotificationsRepository();
