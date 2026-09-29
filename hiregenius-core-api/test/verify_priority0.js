const http = require('http');
const mysql = require('mysql2/promise');

async function main() {
  console.log('=== STARTING PRIORITY 0 ISOLATED VERIFICATION ===\n');

  const db = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'supersecret',
    database: 'hiregenius',
  });

  function request(options, body = null) {
    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          let parsed;
          try { parsed = JSON.parse(data); } catch { parsed = data; }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      });
      req.on('error', reject);
      if (body) {
        req.write(typeof body === 'string' ? body : JSON.stringify(body));
      }
      req.end();
    });
  }

  // 1. Setup a test recruiter & candidate by registering them through Auth Service
  const testRecruiterEmail = 'p0_recruiter@hiregenius.ai';
  const testCandidateEmail = 'p0_candidate@hiregenius.ai';
  const testPassword = 'Password123';

  await db.query(`DELETE FROM users WHERE email IN (?, ?)`, [testRecruiterEmail, testCandidateEmail]);

  const regRecruiter = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    name: 'P0 Recruiter',
    email: testRecruiterEmail,
    password: testPassword,
    role: 'RECRUITER',
  });

  if (regRecruiter.status !== 201) {
    throw new Error(`Recruiter registration failed: ${JSON.stringify(regRecruiter.body)}`);
  }

  const regCandidate = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    name: 'P0 Candidate',
    email: testCandidateEmail,
    password: testPassword,
    role: 'CANDIDATE',
  });

  if (regCandidate.status !== 201) {
    throw new Error(`Candidate registration failed: ${JSON.stringify(regCandidate.body)}`);
  }

  const [recruiterRows] = await db.query(`SELECT id FROM users WHERE email = ?`, [testRecruiterEmail]);
  const recruiterId = recruiterRows[0].id;

  const [candidateRows] = await db.query(`SELECT id FROM users WHERE email = ?`, [testCandidateEmail]);
  const candidateId = candidateRows[0].id;

  // Set recruiter to active, verified, approved, can_post_jobs=1
  await db.query(`UPDATE users SET is_active = 1, email_verified = 1, admin_approved = 1, can_post_jobs = 1, can_apply_to_jobs = 1 WHERE id = ?`, [recruiterId]);
  // Set candidate to active, verified, can_apply_to_jobs=1
  await db.query(`UPDATE users SET is_active = 1, email_verified = 1, admin_approved = 1, can_post_jobs = 1, can_apply_to_jobs = 1 WHERE id = ?`, [candidateId]);

  console.log(`[Setup] Registered recruiter ID ${recruiterId}, candidate ID ${candidateId}`);

  // Also ensure candidate profile exists in 'candidates' table for apply check
  const [candRows] = await db.query('SELECT * FROM candidates WHERE user_id = ?', [candidateId]);
  if (candRows.length === 0) {
    await db.query(
      `INSERT INTO candidates (user_id, resume_path, resume_original_name) VALUES (?, 'uploads/res.pdf', 'resume.pdf')`,
      [candidateId]
    );
  }

  // 2. Login recruiter via Auth Service (port 8080)
  const loginRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: testRecruiterEmail, password: testPassword });

  if (loginRes.status !== 200 || !loginRes.body.token) {
    throw new Error(`Recruiter login failed: ${JSON.stringify(loginRes.body)}`);
  }
  const recruiterToken = loginRes.body.token;
  console.log(`[Step 1] Logged in recruiter. Token acquired.`);

  // Login candidate via Auth Service
  const candLoginRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: testCandidateEmail, password: testPassword });

  const candidateToken = candLoginRes.body.token;
  console.log(`[Step 1b] Logged in candidate. Token acquired.`);

  // 3. Post a job with recruiterToken -> MUST succeed (201)
  const postJobRes1 = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/jobs',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${recruiterToken}`,
    },
  }, {
    title: 'P0 Test Engineer',
    company: 'TestCorp',
    skills: ['Node.js', 'MySQL'],
    description: 'Testing live account deactivation',
  });

  console.log(`[Step 2] Post job while active: Status = ${postJobRes1.status} (Expected: 201)`);
  if (postJobRes1.status !== 201) {
    throw new Error(`Failed to post job: ${JSON.stringify(postJobRes1.body)}`);
  }
  const createdJobId = postJobRes1.body.data.id;

  // 4. Admin disables recruiter account (is_active = 0) in DB
  await db.query(`UPDATE users SET is_active = 0 WHERE id = ?`, [recruiterId]);
  console.log(`[Step 3] Deactivated recruiter account in MySQL: is_active = 0`);

  // 5. Immediately attempt to post job with SAME token (NO re-login) -> MUST return 403 Forbidden
  const postJobRes2 = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/jobs',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${recruiterToken}`,
    },
  }, {
    title: 'P0 Sneaky Job',
    company: 'TestCorp',
    skills: ['Node.js'],
    description: 'Should fail immediately',
  });

  console.log(`[Step 4] Post job with same token after is_active=0: Status = ${postJobRes2.status}, Message = "${postJobRes2.body.message}"`);
  if (postJobRes2.status !== 403) {
    throw new Error(`SECURITY VULNERABILITY! Deactivated account was NOT rejected with 403 on job post! Got status: ${postJobRes2.status}`);
  }

  // 6. Attempt another authenticated route (GET /api/jobs/mine) -> MUST return 403 Forbidden
  const getJobsRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/jobs/mine',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${recruiterToken}`,
    },
  });

  console.log(`[Step 5] GET /api/jobs/mine with same token: Status = ${getJobsRes.status}, Message = "${getJobsRes.body.message}"`);
  if (getJobsRes.status !== 403) {
    throw new Error(`SECURITY VULNERABILITY! Deactivated account was NOT rejected with 403 on GET /api/jobs/mine! Got status: ${getJobsRes.status}`);
  }

  // 7. Auth service check: attempt change-password behind JwtAuthFilter -> MUST return 403 Forbidden
  const changePwRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/change-password',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${recruiterToken}`,
    },
  }, {
    currentPassword: testPassword,
    newPassword: 'NewPassword123',
  });

  console.log(`[Step 6] Auth Service /api/auth/change-password while is_active=0: Status = ${changePwRes.status}`);
  if (changePwRes.status !== 403) {
    throw new Error(`Auth Service did NOT reject deactivated account with 403! Got status: ${changePwRes.status}`);
  }

  // 8. Re-activate account, but set can_post_jobs = 0
  await db.query(`UPDATE users SET is_active = 1, can_post_jobs = 0 WHERE id = ?`, [recruiterId]);
  console.log(`[Step 7] Re-activated recruiter with can_post_jobs = 0`);

  // Same token: GET /api/jobs/mine SHOULD work (200)
  const getJobsRes2 = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/jobs/mine',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${recruiterToken}`,
    },
  });
  console.log(`[Step 7a] GET /api/jobs/mine with can_post_jobs=0: Status = ${getJobsRes2.status} (Expected: 200)`);
  if (getJobsRes2.status !== 200) {
    throw new Error(`Expected 200 for GET /api/jobs/mine when can_post_jobs=0, got: ${getJobsRes2.status}`);
  }

  // Same token: POST /api/jobs MUST return 403 Forbidden ("Your permission to post jobs has been revoked")
  const postJobRes3 = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/jobs',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${recruiterToken}`,
    },
  }, {
    title: 'P0 Revoked Priv Job',
    company: 'TestCorp',
    skills: ['Node.js'],
    description: 'Should fail immediately',
  });
  console.log(`[Step 7b] POST /api/jobs with can_post_jobs=0: Status = ${postJobRes3.status}, Message = "${postJobRes3.body.message}"`);
  if (postJobRes3.status !== 403) {
    throw new Error(`Expected 403 for POST /api/jobs when can_post_jobs=0, got: ${postJobRes3.status}`);
  }

  // 9. Candidate test: set can_apply_to_jobs = 0
  await db.query(`UPDATE users SET can_apply_to_jobs = 0 WHERE id = ?`, [candidateId]);
  console.log(`[Step 8] Set candidate can_apply_to_jobs = 0`);

  // Candidate attempts to apply to createdJobId -> MUST return 403 Forbidden
  const applyRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/applications',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${candidateToken}`,
    },
  }, {
    jobId: createdJobId,
  });
  console.log(`[Step 8a] POST /api/applications with can_apply_to_jobs=0: Status = ${applyRes.status}, Message = "${applyRes.body.message}"`);
  if (applyRes.status !== 403) {
    throw new Error(`Expected 403 for candidate apply with can_apply_to_jobs=0, got: ${applyRes.status}`);
  }

  // Candidate is deactivated completely (is_active = 0)
  await db.query(`UPDATE users SET is_active = 0 WHERE id = ?`, [candidateId]);
  const candGetMineRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/applications/mine',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${candidateToken}`,
    },
  });
  console.log(`[Step 8b] Candidate GET /api/applications/mine with is_active=0: Status = ${candGetMineRes.status}, Message = "${candGetMineRes.body.message}"`);
  if (candGetMineRes.status !== 403) {
    throw new Error(`Expected 403 for candidate GET /api/applications/mine with is_active=0, got: ${candGetMineRes.status}`);
  }

  // 10. Recruiter admin_approved = 0 test
  await db.query(`UPDATE users SET is_active = 1, can_post_jobs = 1, admin_approved = 0 WHERE id = ?`, [recruiterId]);
  const postJobRes4 = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/jobs',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${recruiterToken}`,
    },
  }, {
    title: 'P0 Unapproved Job',
    company: 'TestCorp',
    skills: ['Node.js'],
    description: 'Should fail immediately',
  });
  console.log(`[Step 9] POST /api/jobs with admin_approved=0: Status = ${postJobRes4.status}, Message = "${postJobRes4.body.message}"`);
  if (postJobRes4.status !== 403) {
    throw new Error(`Expected 403 for POST /api/jobs when admin_approved=0, got: ${postJobRes4.status}`);
  }

  // Clean up test data
  await db.query('DELETE FROM applications WHERE job_id = ?', [createdJobId]);
  await db.query('DELETE FROM jobs WHERE id = ?', [createdJobId]);
  await db.query('DELETE FROM candidates WHERE user_id = ?', [candidateId]);
  await db.query('DELETE FROM users WHERE email IN (?, ?)', [testRecruiterEmail, testCandidateEmail]);
  await db.end();

  console.log('\n======================================================');
  console.log('✅ ALL PRIORITY 0 VERIFICATION CHECKS PASSED PERFECTLY!');
  console.log('======================================================\n');
}

main().catch(err => {
  console.error('\n❌ VERIFICATION FAILED:', err);
  process.exit(1);
});
