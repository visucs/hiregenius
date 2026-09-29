const jwt = require('jsonwebtoken');
const db = require('../src/config/db');
const env = require('../src/config/env');

const CORE_URL = 'http://localhost:4000/api';

function makeToken({ userId, email, role }) {
  return jwt.sign({ userId, role }, env.JWT_SIGNING_KEY, {
    subject: email,
    expiresIn: '1h',
    algorithm: 'HS256',
  });
}

async function apiRequest(method, url, token, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runLiveVerification() {
  console.log('--- Starting Live End-to-End Verification ---');

  // Seed test users
  const adminId = 9991;
  const recruiterId = 9992;
  const candidateId = 9993;

  await db('users').whereIn('id', [adminId, recruiterId, candidateId]).del();
  await db('users').insert([
    { id: adminId, name: 'Super Admin', email: 'superadmin_test@hiregenius.ai', role: 'ADMIN', password: 'hash', is_active: 1, email_verified: 1, admin_approved: 1, can_post_jobs: 1, can_apply_to_jobs: 1 },
    { id: recruiterId, name: 'Live Recruiter', email: 'recruiter_live@hiregenius.ai', role: 'RECRUITER', password: 'hash', is_active: 1, email_verified: 1, admin_approved: 1, can_post_jobs: 1, can_apply_to_jobs: 1 },
    { id: candidateId, name: 'Live Candidate', email: 'candidate_live@hiregenius.ai', role: 'CANDIDATE', password: 'hash', is_active: 1, email_verified: 1, admin_approved: 1, can_post_jobs: 1, can_apply_to_jobs: 1 },
  ]);

  const adminToken = makeToken({ userId: adminId, email: 'superadmin_test@hiregenius.ai', role: 'ADMIN' });
  const recruiterToken = makeToken({ userId: recruiterId, email: 'recruiter_live@hiregenius.ai', role: 'RECRUITER' });

  // 1. Verify GET /api/admin/users/:id drill-down (Part 3)
  console.log('1. Testing GET /api/admin/users/:id drill-down...');
  const detailRes = await apiRequest('GET', `${CORE_URL}/admin/users/${recruiterId}`, adminToken);
  console.log('   Status:', detailRes.status, '| Role:', detailRes.data?.data?.role, '| Total Jobs:', detailRes.data?.data?.recruiterActivity?.totalJobsPosted);
  if (detailRes.status !== 200 || detailRes.data?.data?.role !== 'RECRUITER') {
    throw new Error('GET drill-down failed');
  }

  // 2. Test Self-deletion guard (Part 2)
  console.log('2. Testing Admin self-deletion guard...');
  const selfDelRes = await apiRequest('DELETE', `${CORE_URL}/admin/users/${adminId}`, adminToken);
  console.log('   Status:', selfDelRes.status, '| Message:', selfDelRes.data?.message);
  if (selfDelRes.status !== 400) throw new Error('Self-deletion should have been rejected');

  // 3. Test active jobs guard (Part 2)
  console.log('3. Testing Active Job guard for Recruiter Deletion...');
  const [jobId] = await db('jobs').insert({
    recruiter_id: recruiterId,
    title: 'Senior DevOps Architect',
    description: 'Leading infra',
    company: 'LiveCorp',
    skills: JSON.stringify(['AWS', 'Terraform']),
    status: 'OPEN',
    is_deleted: 0,
  });

  const activeJobDelRes = await apiRequest('DELETE', `${CORE_URL}/admin/users/${recruiterId}`, adminToken);
  console.log('   Status:', activeJobDelRes.status, '| Message:', activeJobDelRes.data?.message);
  if (activeJobDelRes.status !== 400) throw new Error('Active job recruiter deletion should have failed');

  // 4. Resolve the job to CLOSED, then delete
  console.log('4. Testing successful cascade deletion after closing jobs...');
  await db('jobs').where({ id: jobId }).update({ status: 'CLOSED' });

  const deleteRes = await apiRequest('DELETE', `${CORE_URL}/admin/users/${recruiterId}`, adminToken);
  console.log('   Status:', deleteRes.status, '| Message:', deleteRes.data?.message);
  if (deleteRes.status !== 200) throw new Error('Permanent deletion failed');

  // Verify DB state
  const recruiterInDb = await db('users').where({ id: recruiterId }).first();
  const jobsInDb = await db('jobs').where({ recruiter_id: recruiterId });
  console.log('   Recruiter in DB after delete:', recruiterInDb, '| Jobs remaining:', jobsInDb.length);
  if (recruiterInDb || jobsInDb.length !== 0) throw new Error('Database cascade was incomplete');

  // 5. Test Candidate in-progress application guard (Part 2)
  console.log('5. Testing Candidate with active application guard...');
  const [candRecId] = await db('candidates').insert({
    user_id: candidateId,
  });

  const [job2Id] = await db('jobs').insert({
    recruiter_id: adminId, // posted by someone else
    title: 'Frontend Engineer',
    description: 'React developer',
    company: 'LiveCorp',
    skills: JSON.stringify(['React']),
    status: 'OPEN',
    is_deleted: 0,
  });

  const [appId] = await db('applications').insert({
    job_id: job2Id,
    candidate_id: candRecId,
    status: 'SCREENING',
  });

  const candActiveAppDelRes = await apiRequest('DELETE', `${CORE_URL}/admin/users/${candidateId}`, adminToken);
  console.log('   Status:', candActiveAppDelRes.status, '| Message:', candActiveAppDelRes.data?.message);
  if (candActiveAppDelRes.status !== 400) throw new Error('Candidate with active application deletion should have failed');

  // 6. Resolve candidate application to REJECTED and delete
  console.log('6. Testing successful candidate cascade deletion once terminal...');
  await db('applications').where({ id: appId }).update({ status: 'REJECTED' });

  const candDeleteRes = await apiRequest('DELETE', `${CORE_URL}/admin/users/${candidateId}`, adminToken);
  console.log('   Status:', candDeleteRes.status, '| Message:', candDeleteRes.data?.message);
  if (candDeleteRes.status !== 200) throw new Error('Candidate permanent deletion failed');

  // Verify candidate removed
  const candUser = await db('users').where({ id: candidateId }).first();
  const candProf = await db('candidates').where({ id: candRecId }).first();
  const candApps = await db('applications').where({ id: appId }).first();
  console.log('   Candidate user in DB:', candUser, '| profile:', candProf, '| application:', candApps);
  if (candUser || candProf || candApps) throw new Error('Candidate DB cascade was incomplete');

  // Cleanup
  await db('jobs').where({ id: job2Id }).del();
  await db('users').where({ id: adminId }).del();

  console.log('\n>>> ALL LIVE VERIFICATION CHECKS PASSED PERFECTLY! <<<');
  process.exit(0);
}

runLiveVerification().catch(err => {
  console.error('LIVE VERIFICATION ERROR:', err);
  process.exit(1);
});
