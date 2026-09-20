const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 850 } });
  page.on('pageerror', error => console.log('UI error:', error.message));
  const user = { id: 1, name: '운영자', email: 'fixture@example.invalid', verified: true, role: 'USER', academicStatus: 'ENROLLED', department: 'CS', studentId: '2018', githubId: 'fixture' };
  const group = { id: '42', name: '연결 테스트 조', recruitId: 'react-study', members: [{ userId: '1', name: '운영자' }], canManage: true };
  let record;
  const payloads = [];
  let conflict = false;
  const application = { id: 3, recruitId: 'react-study', recruitTitle: '연결 테스트', role: '스터디원', body: '함께 공부하고 싶습니다.', status: 'submitted', userId: 2, userName: '참여자' };
  const profile = { id: '1', name: '운영자', initials: '운', tone: 'mint', role: '회원', grade: '3학년', lab: 'CS', githubHandle: 'fixture', githubUrl: '', focus: '', bio: '테스트 프로필', activityNote: '', awardNote: '', recentCommit: '', sharedRepos: [], logs: [], solvedHandle: '', solvedTier: 'unrated', solvedCount: 0, githubCommits: 0, totalPoints: 0, awards: [] };
  const recruit = { id: 'react-study', title: '연결 테스트', shortDesc: '주간 활동을 함께 기록합니다.', category: 'study', status: 'open', authorId: 1, currentMembers: 0, maxMembers: 6, host: '운영자', hostInitials: '운', hostTone: 'mint', hostRole: '작성자', trustScore: 0, tags: [], techStack: ['React'], roles: [{ label: '스터디원', current: 0, max: 6 }], meetingType: '온라인', expectedDuration: '8주', detailContent: ['공부하고 기록합니다.'], processList: ['지원', '승인', '활동'], comments: [], createdAt: '2026.09.20', views: 1, bookmarks: 0 };
  await page.addInitScript(user => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('refreshToken', 'fixture-only');
    localStorage.setItem('accessToken', 'fixture-only');
  }, user);
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    if (!path.startsWith('/api/')) return route.continue();
    const method = route.request().method();
    let data = [];
    if (path === '/api/auth/refresh') data = { accessToken: 'fixture-only', refreshToken: 'fixture-only', user };
    else if (path === '/api/notifications/unread-count') data = { count: 0 };
    else if (path === '/api/users') data = [profile];
    else if (path === '/api/users/1') data = profile;
    else if (path === '/api/recruits/react-study') data = recruit;
    else if (path === '/api/recruits/react-study/applications') data = [application];
    else if (path === '/api/recruits/react-study/applications/3') {
      application.status = route.request().postDataJSON().status;
      if (application.status === 'accepted') group.members.push({ userId: '2', name: '참여자' });
      data = application;
    }
    else if (path === '/api/study/groups') data = [group];
    else if (path.startsWith('/api/study/records')) {
      if (method === 'POST' || method === 'PATCH') {
        const payload = route.request().postDataJSON();
        payloads.push(payload);
        if (conflict) return route.fulfill({ status: 409, json: { message: 'Conflict' } });
        record = { ...payload, id: 'server-record-uuid', groupId: String(payload.groupId), version: (record?.version ?? -1) + 1, updatedAt: new Date().toISOString(), canManage: true, attendance: payload.attendance.map(entry => ({ ...entry, userId: String(entry.userId), name: '운영자' })) };
        data = record;
      } else data = path === '/api/study/records' ? record ? [record] : [] : record;
    }
    await route.fulfill({ status: 200, json: data, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' } });
  });
  await page.goto('http://127.0.0.1:3000/community/activity/records/new?group=42', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'design/qa/api-initial.png', fullPage: true });
  console.log('Initial page:', page.url(), (await page.locator('main').innerText()).slice(0, 1000));
  await page.getByLabel('제목', { exact: true }).fill('실제 API 계약 테스트');
  await page.getByLabel('오늘 어떤 활동을 했나요?').fill('## 본문\n출석 기록');
  await page.getByRole('button', { name: '전체 출석', exact: true }).click();
  await page.getByRole('button', { name: '기록 저장', exact: true }).click();
  await page.waitForURL('**/records/server-record-uuid?*');
  assert.equal(payloads[0].groupId, 42);
  assert.equal(payloads[0].attendance[0].userId, 1);
  assert.equal(payloads[0].attendance[0].status, 'present');
  assert.equal(payloads[0].id, undefined, 'Server owns record ID');
  await page.getByRole('link', { name: '수정', exact: true }).click();
  await page.getByLabel('제목', { exact: true }).fill('수정 충돌 보존 테스트');
  conflict = true;
  await page.getByRole('button', { name: '기록 저장', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: '다른 사람이 먼저 수정했습니다' }).waitFor();
  assert.equal(await page.getByLabel('제목', { exact: true }).inputValue(), '수정 충돌 보존 테스트');
  assert.equal(payloads[1].version, 0);
  await page.screenshot({ path: 'design/qa/api-edit-conflict.png', fullPage: true });
  console.log('PASS: authenticated API mode, numeric IDs, server-generated ID, version payload, conflict retains draft');
  await page.goto('http://127.0.0.1:3000/community/recruit/notices/react-study');
  await page.getByRole('region', { name: '지원자 관리' }).locator('summary').click();
  await page.getByLabel('지원 상태', { exact: true }).selectOption('accepted');
  await page.getByRole('region', { name: '지원자 관리' }).getByText('승인', { exact: true }).first().waitFor();
  await page.getByRole('link', { name: '연결 테스트 조', exact: true }).click();
  await page.waitForURL('**/community/activity?group=42');
  await page.getByRole('link', { name: '기록 작성', exact: true }).first().click();
  await page.getByLabel('참여자 출석 상태').waitFor();
  await page.goto('http://127.0.0.1:3000/users/1');
  await page.getByRole('link', { name: '내 활동과 출석' }).waitFor();
  await page.screenshot({ path: 'design/qa/profile-connections.png', fullPage: true });
  for (const width of [320, 768, 1280]) {
    await page.setViewportSize({ width, height: 850 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), `Profile overflow at ${width}`);
    await page.screenshot({ path: `design/qa/profile-${width}.png`, fullPage: true });
  }
  await page.getByRole('link', { name: '내 활동과 출석' }).click();
  await page.waitForURL('**/community/activity?user=1');
  console.log('PASS: recruitment approval -> group roster; profile -> personal activity');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
