const { z } = require('zod');
const { apiErrorSchema, apiSuccessEnvelopeSchema } = require('../jobs/jobs.validation');

const notificationEntitySchema = z
  .object({
    id: z.number().int().positive().openapi({ example: 1 }),
    user_id: z.number().int().positive().openapi({ example: 25 }),
    type: z
      .enum(['APPLICATION_RECEIVED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_CANCELLED', 'STATUS_CHANGED'])
      .openapi({ example: 'INTERVIEW_SCHEDULED' }),
    message: z.string().openapi({ example: 'An interview has been scheduled for Senior Backend Engineer' }),
    related_entity_type: z.string().nullable().optional().openapi({ example: 'INTERVIEW' }),
    related_entity_id: z.number().nullable().optional().openapi({ example: 10 }),
    is_read: z.boolean().openapi({ example: false }),
    created_at: z.string().openapi({ example: '2026-09-26T12:00:00.000Z' }),
  })
  .openapi('Notification');

const paginatedNotificationsSchema = z
  .object({
    notifications: z.array(notificationEntitySchema),
    total: z.number().int().openapi({ example: 1 }),
    page: z.number().int().openapi({ example: 1 }),
    limit: z.number().int().openapi({ example: 20 }),
    totalPages: z.number().int().openapi({ example: 1 }),
  })
  .openapi('PaginatedNotifications');

function registerNotificationsOpenApi(registry) {
  // 1. GET /api/notifications
  registry.registerPath({
    method: 'get',
    path: '/api/notifications',
    summary: 'Get notifications for logged-in user',
    description: 'Retrieves paginated notifications for the authenticated user (Recruiter, Candidate, or Admin).',
    tags: ['Notifications'],
    security: [{ bearerAuth: [] }],
    request: {
      query: z.object({
        is_read: z.string().optional().openapi({ example: 'false', description: 'Filter by read status (true/false)' }),
        page: z.string().optional().openapi({ example: '1' }),
        limit: z.string().optional().openapi({ example: '20' }),
      }),
    },
    responses: {
      200: {
        description: 'Notifications retrieved successfully',
        content: {
          'application/json': {
            schema: apiSuccessEnvelopeSchema(paginatedNotificationsSchema, 'Notifications retrieved successfully'),
          },
        },
      },
      401: {
        description: 'Unauthorized - invalid or missing token',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
    },
  });

  // 2. PATCH /api/notifications/read-all
  registry.registerPath({
    method: 'patch',
    path: '/api/notifications/read-all',
    summary: 'Mark all notifications as read',
    description: 'Marks all unread notifications belonging to the logged-in user as read.',
    tags: ['Notifications'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'All notifications marked as read',
        content: {
          'application/json': {
            schema: apiSuccessEnvelopeSchema(
              z.object({ updatedCount: z.number().int().openapi({ example: 5 }) }),
              'All notifications marked as read',
            ),
          },
        },
      },
      401: {
        description: 'Unauthorized - invalid or missing token',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
    },
  });

  // 3. PATCH /api/notifications/{id}/read
  registry.registerPath({
    method: 'patch',
    path: '/api/notifications/{id}/read',
    summary: 'Mark a single notification as read',
    description: 'Marks a single notification as read. Enforces ownership: returns 403 if it belongs to another user.',
    tags: ['Notifications'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().openapi({ example: '1', description: 'Notification ID' }),
      }),
    },
    responses: {
      200: {
        description: 'Notification marked as read',
        content: {
          'application/json': {
            schema: apiSuccessEnvelopeSchema(notificationEntitySchema, 'Notification marked as read'),
          },
        },
      },
      401: {
        description: 'Unauthorized - invalid or missing token',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
      403: {
        description: 'Forbidden - not the owner of the notification',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
      404: {
        description: 'Notification not found',
        content: { 'application/json': { schema: apiErrorSchema } },
      },
    },
  });
}

module.exports = {
  notificationEntitySchema,
  registerNotificationsOpenApi,
};
