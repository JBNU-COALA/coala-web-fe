// Read-only by default. Write checks require QA_WRITE=1 and a verified QA account.
// Credentials/tokens are read from the process environment, never written to disk.
const assert = require('node:assert/strict');
const base = new URL(process.env.QA_BASE_URL || 'https://coala.jbnu.ac.kr');
if (base.protocol !== 'https:' || base.username || base.password) throw new Error('Use an HTTPS deployed API origin.');
let token;
let failed = false;
const marker = 'QA-CRUD-' + Date.now();
const date = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
const cleanup = [];

async function request(path, method = 'GET', payload) {
  const response = await fetch(new URL(path, base), {
    method, redirect: 'error', signal: AbortSignal.timeout(20000),
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  // Never log response bodies, account details or tokens.
  console.log(method, path, response.status);
  if (!response.ok) throw new Error(method + ' ' + path + ': HTTP ' + response.status + ' ' + (data?.errorCode || ''));
  return data;
}

async function check(name, createPath, body, { key = 'id', readPath, mutationPath, versioned = false } = {}) {
  try {
    const created = await request(createPath, 'POST', body);
    assert.ok(created?.[key], 'Missing server ID');
    const id = encodeURIComponent(created[key]);
    const read = readPath ? readPath(id) : createPath + '/' + id;
    const mutation = mutationPath ? mutationPath(id) : read;
    let version = created.version;
    const remove = async () => {
      if (versioned) version = (await request(read)).version;
      await request(mutation + (versioned ? '?version=' + version : ''), 'DELETE');
    };
    cleanup.push({ name, remove });
    const loaded = await request(read);
    assert.equal(loaded.title, body.title);
    const changed = { ...body, title: body.title + ' 수정', ...(versioned ? { version } : {}) };
    await request(mutation, 'PATCH', changed);
    const updated = await request(read);
    assert.equal(updated.title, changed.title);
    await remove();
    cleanup.pop();
    console.log('PASS', name, 'create/read/update/delete');
  } catch (error) { failed = true; console.error('FAIL', name, error.message); }
}

(async () => {
  let boards;
  for (const path of ['/api/boards', '/api/info', '/api/recruits', '/api/services', '/api/archive']) {
    try { const data = await request(path); if (path === '/api/boards') boards = data; }
    catch (error) { failed = true; console.error(error.message); }
  }
  if (process.env.QA_WRITE !== '1') { console.log('READ-ONLY: authenticated CRUD not tested.'); return; }
  if (!process.env.QA_EMAIL || !process.env.QA_PASSWORD) throw new Error('QA_EMAIL and QA_PASSWORD are required.');
  const auth = await request('/api/auth/login', 'POST', { email: process.env.QA_EMAIL, password: process.env.QA_PASSWORD });
  assert.ok(auth.user?.verified, 'Use a verified test account.');
  assert.ok(auth.accessToken, 'Missing access token');
  token = auth.accessToken;
  await check('recruit', '/api/recruits', {
    title: marker + ' 모집', shortDesc: '임시 연동 검증 데이터', category: 'study',
    roles: [{ label: '테스트 역할', max: 1 }], techStack: [], meetingType: '온라인', expectedDuration: '1일',
    status: 'open', tags: [], detailContent: ['임시 검증 기록, 테스트 후 삭제합니다.'], processList: [],
  });
  await check('activity', '/api/study/records', {
    groupId: null, title: marker + ' 활동', date, content: '임시 검증 기록', attendance: [],
  }, { versioned: true });
  await check('info', '/api/info', {
    filter: 'resource', tag: '자료', title: marker + ' 정보', meta: '검증', sourceName: 'QA',
    sourceDate: date, content: '임시 검증 기록', imageUrl: '',
  });
  await check('archive', '/api/archive', {
    category: 'agents', title: marker + ' 자료', summary: '임시 검증 기록', content: '임시 검증 기록',
    sourceUrl: '', repositoryUrl: '', tags: ['QA'],
  });
  const board = boards?.find(entry => entry.boardName === '자유' || entry.name === '자유');
  if (board?.boardId) {
    const root = '/api/boards/' + board.boardId + '/posts';
    await check('board', root, { title: marker + ' 게시글', content: '임시 검증 기록' }, {
      key: 'postId', mutationPath: id => '/api/posts/' + id,
    });
  } else { failed = true; console.log('SKIP board: no known free board; no board configuration was changed.'); }
  // Service DELETE means retire, not removal; do not leave a public QA service behind.
  console.log('Service creation/retirement and resource applications require a disposable staging environment.');
})().catch(error => { failed = true; console.error(error.message); }).finally(async () => {
  for (const item of cleanup.reverse()) {
    try { await item.remove(); console.log('CLEANED', item.name); }
    catch (error) { failed = true; console.error('CLEANUP REQUIRED', item.name, error.message); }
  }
  if (failed) process.exitCode = 1;
});
