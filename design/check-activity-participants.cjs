const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
    const user = { id: 1, name: '작성자', email: 'fixture@example.invalid', role: 'USER', verified: true };
    const people = [{ userId: '1', name: '작성자', githubId: 'author', department: '컴퓨터공학부' },
      { userId: '2', name: '함께 모임한 회원', githubId: 'guest', department: '컴퓨터인공지능학부' },
      { userId: '3', name: '추가 참여자', githubId: 'another', department: '전자공학부' }];
    const group = { id: '42', name: '스터디 조', canManage: true, members: [people[0]] };
    let record, searchFails = false, conflict = false;
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('dialog', dialog => dialog.accept());
    await page.addInitScript(user => {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('accessToken', 'fixture-only');
      localStorage.setItem('refreshToken', 'fixture-only');
    }, user);
    await page.route('**/api/**', async route => {
      const url = new URL(route.request().url()), path = url.pathname, method = route.request().method();
      if (!path.startsWith('/api/')) return route.continue();
      let data = [];
      if (path === '/api/auth/refresh') data = { user, accessToken: 'fixture-only', refreshToken: 'fixture-only' };
      else if (path === '/api/notifications/unread-count') data = { count: 0 };
      else if (path === '/api/study/groups') data = [group];
      else if (path === '/api/study/members') {
        if (searchFails) return route.fulfill({ status: 503, json: {} });
        const query = url.searchParams.get('query') || '';
        data = people.filter(p => p.name.includes(query) || p.githubId.includes(query));
      } else if (path.startsWith('/api/study/records')) {
        if (method === 'POST' || method === 'PATCH') {
          if (conflict) return route.fulfill({ status: 409, json: {} });
          const body = route.request().postDataJSON();
          record = { ...body, id: 'participant-record', groupId: body.groupId ? String(body.groupId) : null,
            version: (record?.version ?? -1) + 1, canManage: true, photos: [], updatedAt: new Date().toISOString(),
            attendance: body.attendance.map(entry => ({ userId: String(entry.userId), name: people.find(p => p.userId === String(entry.userId)).name, status: entry.status })) };
        }
        data = method === 'GET' && path === '/api/study/records' ? record ? [record] : [] : record;
      }
      await route.fulfill({ status: 200, json: data });
    });
    const root = 'http://127.0.0.1:3000';
    await page.goto(root + '/community/activity/records/new');
    await page.getByLabel('제목', { exact: true }).fill('조 없이 함께한 모임');
    await page.getByLabel('오늘 어떤 활동을 했나요?').fill('직접 선택한 참여자와 출석 기록');
    const search = page.getByLabel('참여자 추가', { exact: true });
    await search.fill('guest');
    await page.getByRole('button', { name: '함께 모임한 회원 (guest) 추가', exact: true }).click();
    await page.getByRole('radiogroup', { name: '함께 모임한 회원 출석 상태' }).getByLabel('출석', { exact: true }).check();
    assert.equal(await page.getByLabel('연결할 조 (선택)').inputValue(), '');
    await search.focus();
    await page.getByRole('button', { name: '함께 모임한 회원 (guest) 추가됨', exact: true }).waitFor();
    assert.ok(await page.getByRole('button', { name: '함께 모임한 회원 (guest) 추가됨', exact: true }).isDisabled());
    await search.press('Enter');
    assert.equal(record, undefined);
    await page.getByRole('button', { name: '저장', exact: true }).click();
    await page.waitForURL('**/records/participant-record?*');
    assert.equal(record.groupId, null);
    assert.deepEqual(record.attendance.map(m => m.userId), ['2']);
    await page.getByRole('link', { name: '수정', exact: true }).click();
    await page.getByLabel('연결할 조 (선택)').selectOption('42');
    assert.ok(await page.getByRole('radiogroup', { name: '함께 모임한 회원 출석 상태' }).getByLabel('출석', { exact: true }).isChecked());
    await page.getByRole('radiogroup', { name: '작성자 출석 상태' }).waitFor();
    await search.fill('another');
    await page.getByRole('button', { name: '추가 참여자 (another) 추가', exact: true }).click();
    await page.getByRole('button', { name: '작성자 참여자 제외', exact: true }).click();
    searchFails = true;
    await search.fill('실패');
    await page.getByRole('alert').filter({ hasText: '회원을 불러오지 못했습니다' }).waitFor();
    assert.equal(await page.getByLabel('제목', { exact: true }).inputValue(), '조 없이 함께한 모임');
    searchFails = false;
    await page.getByRole('button', { name: '다시 시도', exact: true }).click();
    await page.getByText('검색 결과가 없습니다.', { exact: true }).waitFor();
    await search.fill('');
    await page.getByRole('button', { name: '작성자 (author) 추가', exact: true }).waitFor();
    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'overflow ' + width);
      await page.locator('.study-editor').screenshot({ path: 'design/qa/participants-' + width + '.png' });
    }
    conflict = true;
    await page.getByRole('button', { name: '저장', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: '다른 사람이 먼저' }).waitFor();
    assert.equal(await page.getByRole('radiogroup').count(), 2);
    conflict = false;
    await page.getByRole('button', { name: '저장', exact: true }).click();
    await page.waitForURL('**/records/participant-record?*');
    assert.deepEqual(record.attendance.map(m => m.userId), ['2', '3']);
    await page.goto(root + '/community/activity');
    await page.getByRole('heading', { name: record.title }).waitFor();
    assert.equal(await page.getByRole('button', { name: '활동 기록', exact: true }).count(), 0);
    await page.getByRole('button', { name: '캘린더형', exact: true }).click();
    await page.getByRole('region', { name: '활동 캘린더' }).waitFor();
    await page.getByRole('button', { name: '카드형', exact: true }).click();
    await page.getByRole('link', { name: new RegExp(record.title) }).click();
    await page.getByRole('link', { name: '수정', exact: true }).click();
    await page.getByRole('button', { name: '추가 참여자 참여자 제외', exact: true }).click();
    await page.getByRole('button', { name: '저장', exact: true }).click();
    await page.waitForURL('**/records/participant-record?*');
    assert.deepEqual(record.attendance.map(m => m.userId), ['2']);
    record.canManage = false;
    await page.reload();
    await page.getByRole('heading', { name: record.title }).waitFor();
    assert.equal(await page.getByLabel('참여자 추가', { exact: true }).count(), 0);
    assert.equal(await page.getByRole('button', { name: /참여자 제외/ }).count(), 0);
    assert.deepEqual(errors, []);
    console.log('PASS manual participants without group, duplicate prevention, group merge preserves attendance, edit/removal, search retry, conflicts, readonly permissions, 4 viewport widths');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
