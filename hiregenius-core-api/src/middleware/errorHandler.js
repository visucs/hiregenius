// Centralized error handling middleware
// Shape: { "status": 400, "message": "...", "timestamp": "...", "path": "/api/jobs" }

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Handle Zod validation errors (supporting both issues and errors array across Zod versions)
  if (err.name === 'ZodError') {
    status = 400;
    const issues = err.issues || err.errors || [];
    if (issues.length > 0) {
      message = issues
        .map((e) => (e.path && e.path.length > 0 ? `${e.path.join('.')}: ${e.message}` : e.message))
        .join(', ');
    } else {
      message = err.message || 'Validation error';
    }
  } else if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token has expired';
  } else if (err.name === 'NotBeforeError') {
    status = 401;
    message = 'Token not active';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON in request body';
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    status = 400;
    message = 'File size exceeds 5MB limit';
  } else if (
    err.code === 'ER_DUP_ENTRY' ||
    err.code === 'SQLITE_CONSTRAINT' ||
    (err.message && err.message.includes('UNIQUE constraint failed'))
  ) {
    status = 409;
    message = 'You have already applied for this job';
  }

  const response = {
    status,
    message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl || req.url,
  };

  if (err.details) {
    response.details = err.details;
  }

  return res.status(status).json(response);
}

module.exports = errorHandler;
