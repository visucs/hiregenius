const ApiError = require('../utils/ApiError');

/**
 * In-memory sliding-window rate limiter for resource-intensive endpoints.
 * Specifically protects the 1 GB production host from AI service request bursts.
 *
 * Defaults:
 * - 10 requests per 60 seconds (1 minute) per authenticated user
 * - Keyed by req.user.userId (fallback to client IP if unauthenticated)
 */
function createRateLimiter({
  windowMs = 60 * 1000,
  max = 10,
  message = 'Rate limit exceeded: maximum 10 ATS checks per minute. Please try again shortly.',
} = {}) {
  const hits = new Map();

  // Periodic cleanup of stale window entries every 2 minutes
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now - record.resetTime > 0) {
        hits.delete(key);
      }
    }
  }, 2 * 60 * 1000);

  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  function rateLimiterMiddleware(req, res, next) {
    const key = req.user?.userId ? `user_${req.user.userId}` : `ip_${req.ip || 'unknown'}`;
    const now = Date.now();

    let record = hits.get(key);
    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      hits.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      res.setHeader('Retry-After', retryAfter);
      return next(
        new ApiError(429, message, {
          retryAfterSeconds: retryAfter,
          limit: max,
          windowSeconds: Math.ceil(windowMs / 1000),
        })
      );
    }

    return next();
  };

  rateLimiterMiddleware.reset = () => {
    hits.clear();
  };

  return rateLimiterMiddleware;
}

const atsRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Rate limit exceeded: maximum 10 ATS checks per minute. Please try again shortly.',
});

module.exports = {
  createRateLimiter,
  atsRateLimiter,
};
