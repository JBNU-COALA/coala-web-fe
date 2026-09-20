// Contract/UI regressions only. This does not replace authenticated deployed API checks.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

(async () => {
  const source = ts.transpileModule(fs.readFileSync('src/pages/recruit/recruitDraft.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const { buildRecruitPayload, itemToDraft } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
  const draft = { title: '제목', shortDesc: '소개', category: 'study', roles: '스터디원:4', techStack: '',
    meetingType: '', expectedDuration: '', tags: '', detailContent: '첫 문장, 쉼표 유지\n둘째 줄\n\n다음 문단', processList: '' };
  const payload = buildRecruitPayload(draft);
  assert.deepEqual(payload.techStack, []);
  assert.deepEqual(payload.processList, []);
  assert.deepEqual(payload.detailContent, ['첫 문장, 쉼표 유지\n둘째 줄', '다음 문단']);
  assert.deepEqual(buildRecruitPayload(itemToDraft(payload)), payload);
  assert.throws(() => buildRecruitPayload({ ...draft, roles: '' }));
  assert.throws(() => buildRecruitPayload({ ...draft, roles: '팀원:201' }));
  assert.throws(() => buildRecruitPayload({ ...draft, roles: '팀원:2\n팀원:3' }));
  assert.throws(() => buildRecruitPayload({ ...draft, title: 'x'.repeat(151) }));
  console.log('PASS recruitment shared create/edit validation and content roundtrip');

  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 850 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('dialog', (dialog) => dialog.accept());
    const user = { id: 1, name: '검증 사용자', email: 'fixture@example.invalid', verified: true, role: 'USER' };
    let record, groupFailure = true, conflict = false, refreshCount = 0, recruitPayload;
    const group = { id: '42', name: '테스트 조', members: [{ userId: '1', name: user.name }], canManage: true };
    await page.addInitScript(user => {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('accessToken', 'fixture-only');
      localStorage.setItem('refreshToken', 'fixture-only');
    }, user);
    await page.route('**/api/**', async route => {
      const path = new URL(route.request().url()).pathname;
      if (!path.startsWith('/api/')) return route.continue();
      const method = route.request().method();
      let data = [];
      if (path === '/api/auth/refresh') {
        refreshCount++;
        data = { accessToken: 'fixture-only', refreshToken: 'fixture-only', user };
      } else if (path === '/api/notifications/unread-count') data = { count: 0 };
      else if (path === '/api/study/groups') {
        if (groupFailure) return route.fulfill({ status: 503, json: {} });
        data = [group];
      } else if (path.startsWith('/api/study/records')) {
        if (method === 'DELETE') { record = null; return route.fulfill({ status: 204 }); }
        if (method === 'POST' || method === 'PATCH') {
          const body = route.request().postDataJSON();
          if (conflict) return route.fulfill({ status: 409, json: { errorCode: 'POST_NOT_EDITABLE' } });
          record = { ...body, id: 'qa-record', groupId: body.groupId ? String(body.groupId) : null,
            authorId: '1', canManage: true, version: (record?.version ?? -1) + 1, updatedAt: new Date().toISOString(),
            attendance: body.attendance.map(entry => ({ ...entry, userId: String(entry.userId), name: user.name })) };
          data = record;
        } else data = path === '/api/study/records' ? record ? [record] : [] : record;
      } else if (path === '/api/recruits' && method === 'POST') {
        recruitPayload = route.request().postDataJSON();
        return route.fulfill({ status: 403, json: { errorCode: 'ACCESS_DENIED' } });
      }
      await route.fulfill({ status: 200, json: data });
    });
    const root = 'http://127.0.0.1:3000';
    await page.goto(root + '/community/activity/records/new');
    await page.getByLabel('제목', { exact: true }).waitFor({ timeout: 10000 }).catch(async error => {
      console.log('DEBUG', page.url(), errors, (await page.locator('body').innerText()).slice(0, 1600));
      throw error;
    });
    await page.getByLabel('제목', { exact: true }).fill('연결 없는 활동');
    await page.getByLabel('오늘 어떤 활동을 했나요?').fill('조 조회가 실패해도 내용 유지');
    await page.getByRole('alert').filter({ hasText: '조 목록' }).waitFor();
    assert.equal(await page.getByRole('button', { name: '전체 출석', exact: true }).count(), 0);
    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 850 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'editor overflow ' + width);
      await page.screenshot({ path: 'design/qa/standalone-editor-' + width + '.png', fullPage: true });
    }
    await page.getByRole('button', { name: '기록 저장', exact: true }).click();
    await page.waitForURL('**/records/qa-record?*');
    assert.equal(record.groupId, null);
    assert.deepEqual(record.attendance, []);
    await page.getByRole('heading', { name: '연결 없는 활동', exact: true }).waitFor();
    assert.equal(await page.getByRole('region', { name: '출석 명단' }).count(), 0);
    await page.getByRole('link', { name: '수정', exact: true }).click();
    await page.getByLabel('제목', { exact: true }).fill('수정 충돌 내용 유지');
    conflict = true;
    await page.getByRole('button', { name: '기록 저장', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: '다른 사람이 먼저' }).waitFor();
    assert.equal(await page.getByLabel('제목', { exact: true }).inputValue(), '수정 충돌 내용 유지');
    conflict = false;
    groupFailure = false;
    await page.goto(root + '/community/activity/records/qa-record/editor');
    await page.getByLabel('연결할 조 (선택)').selectOption('42');
    await page.getByRole('button', { name: '전체 출석', exact: true }).click();
    await page.getByRole('button', { name: '기록 저장', exact: true }).click();
    await page.waitForURL('**/records/qa-record?*');
    assert.equal(record.groupId, '42');
    assert.equal(record.attendance[0].status, 'present');
    await page.getByRole('button', { name: '삭제', exact: true }).click();
    await page.waitForURL('**/community/activity?*');
    assert.equal(record, null);
    console.log('PASS standalone activity create/read/edit/link/delete; failed group lookup and conflicts preserve editor');

    await page.goto(root + '/community/recruit/notices/new');
    await page.getByLabel('제목', { exact: true }).fill('공고 입력 검증');
    await page.getByLabel('한 줄 소개', { exact: true }).fill('검증');
    await page.getByLabel('모집 역할/인원', { exact: true }).fill('팀원:2');
    await page.getByLabel('모집 소개', { exact: true }).fill('소개, 쉼표 유지');
    const before = refreshCount;
    await page.getByRole('button', { name: '작성 완료', exact: true }).click();
    await page.getByText('이 작업을 수행할 권한이 없습니다.', { exact: true }).waitFor();
    assert.equal(refreshCount, before, 'permission denial must not refresh or log out');
    assert.equal(await page.getByLabel('모집 소개', { exact: true }).inputValue(), '소개, 쉼표 유지');
    assert.deepEqual(recruitPayload.techStack, []);
    assert.deepEqual(recruitPayload.processList, []);
    assert.deepEqual(recruitPayload.detailContent, ['소개, 쉼표 유지']);
    assert.deepEqual(errors, []);
    console.log('PASS recruitment optional fields and denied save preserves draft/session');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
