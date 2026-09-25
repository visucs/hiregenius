const requireRole = require('../../src/middleware/requireRole');

describe('requireRole Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { user: null };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  test('should pass when user has exact required role', () => {
    req.user = { userId: 1, email: 'recruiter@hiregenius.ai', role: 'RECRUITER' };

    const middleware = requireRole('RECRUITER');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeUndefined();
  });

  test('should return 403 Forbidden when user has wrong role', () => {
    req.user = { userId: 2, email: 'candidate@hiregenius.ai', role: 'CANDIDATE' };

    const middleware = requireRole('RECRUITER');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(403);
    expect(err.message).toMatch(/Forbidden/i);
  });

  test('should return 401 Unauthorized when user is not attached to request', () => {
    req.user = null;

    const middleware = requireRole('RECRUITER');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(401);
  });

  test('should pass when user has one of multiple allowed roles', () => {
    req.user = { userId: 3, email: 'admin@hiregenius.ai', role: 'ADMIN' };

    const middleware = requireRole('RECRUITER', 'ADMIN');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeUndefined();
  });
});
