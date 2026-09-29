jest.mock('../../src/config/db', () => {
  return jest.fn();
});

const jwt = require('jsonwebtoken');
const db = require('../../src/config/db');
const verifyJwt = require('../../src/middleware/verifyJwt');
const env = require('../../src/config/env');

describe('verifyJwt Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();

    db.mockReturnValue({
      where: jest.fn().mockReturnValue({
        first: jest.fn().mockResolvedValue({
          id: 42,
          is_active: 1,
          email_verified: 1,
          admin_approved: 1,
          can_post_jobs: 1,
          can_apply_to_jobs: 1,
        }),
      }),
    });
  });

  test('should pass with valid HS256 token and attach req.user', async () => {
    const payload = {
      userId: 42,
      role: 'RECRUITER',
    };
    const token = jwt.sign(payload, env.JWT_SIGNING_KEY, {
      subject: 'recruiter@hiregenius.ai',
      expiresIn: '1h',
      algorithm: 'HS256',
    });

    req.headers.authorization = `Bearer ${token}`;

    await verifyJwt(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const errArg = next.mock.calls[0][0];
    expect(errArg).toBeUndefined();
    expect(req.user).toEqual({
      userId: 42,
      email: 'recruiter@hiregenius.ai',
      role: 'RECRUITER',
      is_active: true,
      email_verified: true,
      admin_approved: true,
      can_post_jobs: true,
      can_apply_to_jobs: true,
    });
  });

  test('should return 403 when user is deactivated in DB (is_active = 0)', async () => {
    db.mockReturnValue({
      where: jest.fn().mockReturnValue({
        first: jest.fn().mockResolvedValue({
          id: 42,
          is_active: 0,
        }),
      }),
    });

    const payload = {
      userId: 42,
      role: 'RECRUITER',
    };
    const token = jwt.sign(payload, env.JWT_SIGNING_KEY, {
      subject: 'recruiter@hiregenius.ai',
      expiresIn: '1h',
      algorithm: 'HS256',
    });

    req.headers.authorization = `Bearer ${token}`;

    await verifyJwt(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(403);
    expect(err.message).toMatch(/deactivated/i);
  });

  test('should return 401 when Authorization header is missing', async () => {
    await verifyJwt(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(401);
    expect(err.message).toMatch(/Authorization header missing/i);
  });

  test('should return 401 when Authorization header does not use Bearer scheme', async () => {
    req.headers.authorization = 'Basic dXNlcjpwYXNz';

    await verifyJwt(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(401);
    expect(err.message).toMatch(/Bearer/i);
  });

  test('should return 401 when user is not found in DB', async () => {
    db.mockReturnValue({
      where: jest.fn().mockReturnValue({
        first: jest.fn().mockResolvedValue(null),
      }),
    });

    const payload = {
      userId: 999,
      role: 'RECRUITER',
    };
    const token = jwt.sign(payload, env.JWT_SIGNING_KEY, {
      subject: 'ghost@hiregenius.ai',
      expiresIn: '1h',
      algorithm: 'HS256',
    });

    req.headers.authorization = `Bearer ${token}`;

    await verifyJwt(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(401);
    expect(err.message).toMatch(/User not found/i);
  });

  test('should return 401 (never 500) when token is expired', async () => {
    const token = jwt.sign(
      { userId: 10, role: 'CANDIDATE' },
      env.JWT_SIGNING_KEY,
      {
        subject: 'candidate@hiregenius.ai',
        expiresIn: '-10s', // Already expired
        algorithm: 'HS256',
      },
    );

    req.headers.authorization = `Bearer ${token}`;

    await verifyJwt(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(401);
    expect(err.message).toMatch(/expired/i);
  });

  test('should return 401 (never 500) when token is tampered with', async () => {
    const token = jwt.sign(
      { userId: 10, role: 'RECRUITER' },
      env.JWT_SIGNING_KEY,
      {
        subject: 'recruiter@hiregenius.ai',
        expiresIn: '1h',
        algorithm: 'HS256',
      },
    );

    // Tamper with payload segment
    const parts = token.split('.');
    parts[1] = Buffer.from(JSON.stringify({ userId: 10, role: 'ADMIN' })).toString('base64');
    const tampered = parts.join('.');

    req.headers.authorization = `Bearer ${tampered}`;

    await verifyJwt(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(401);
    expect(err.message).toMatch(/Invalid or tampered token/i);
  });

  test('should return 401 when token is signed with wrong secret', async () => {
    const token = jwt.sign(
      { userId: 10, role: 'RECRUITER' },
      'wrong_secret_key_12345678901234567890',
      {
        subject: 'recruiter@hiregenius.ai',
        expiresIn: '1h',
        algorithm: 'HS256',
      },
    );

    req.headers.authorization = `Bearer ${token}`;

    await verifyJwt(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(401);
    expect(err.message).toMatch(/Invalid or tampered token/i);
  });

  test('should return 401 when token payload lacks userId', async () => {
    const token = jwt.sign(
      { role: 'RECRUITER' }, // No userId
      env.JWT_SIGNING_KEY,
      {
        subject: 'recruiter@hiregenius.ai',
        expiresIn: '1h',
        algorithm: 'HS256',
      },
    );

    req.headers.authorization = `Bearer ${token}`;

    await verifyJwt(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(401);
    expect(err.message).toMatch(/missing userId/i);
  });
});
