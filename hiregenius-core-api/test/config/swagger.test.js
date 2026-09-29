const request = require('supertest');
const app = require('../../src/app');

describe('Swagger / OpenAPI Documentation', () => {
  it('GET /api-docs.json should return valid OpenAPI 3.0.0 JSON specification', async () => {
    const res = await request(app).get('/api-docs.json');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toHaveProperty('openapi', '3.0.0');
    expect(res.body).toHaveProperty('info');
    expect(res.body.info).toHaveProperty('title', 'HireGenius Core API');
    expect(res.body).toHaveProperty('paths');
    expect(res.body.paths).toHaveProperty('/api/jobs');
    expect(res.body.paths).toHaveProperty('/api/jobs/mine');
    expect(res.body.paths).toHaveProperty('/api/jobs/{id}');
    expect(res.body.paths).toHaveProperty('/api/jobs/{id}/status');
    expect(res.body).toHaveProperty('components');
    expect(res.body.components).toHaveProperty('securitySchemes');
    expect(res.body.components.securitySchemes).toHaveProperty('bearerAuth');
  });

  it('GET /api-docs should redirect to /swagger-ui/index.html', async () => {
    const res = await request(app).get('/api-docs');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/swagger-ui/index.html');
  });

  it('GET /swagger-ui should redirect to /swagger-ui/index.html', async () => {
    const res = await request(app).get('/swagger-ui');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/swagger-ui/index.html');
  });

  it('GET /swagger-ui/index.html should serve the interactive Swagger UI page', async () => {
    const res = await request(app).get('/swagger-ui/index.html');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('Swagger UI');
  });
});
