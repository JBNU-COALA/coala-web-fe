const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=', 'base64');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 850 } });
    const user = { id: 1, name: '테스트 운영자', email: 'fixture@example.invalid', role: 'USER', verified: true };
    const members = [{ userId: '1', name: '김코알라' }, { userId: '2', name: '이름이 긴 참여자' }];
    const date = new Date().toLocaleDateString('en-CA');
    let record = { id: 'session-1', title: 'React 스터디 3주차', date, groupId: '42', content: '학습 기록',
      canManage: true, version: 0, updatedAt: new Date().toISOString(), photos: [],
      attendance: members.map(m => ({ ...m, status: 'unknown' })) };
    let fail = false, nextId = 100;
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(user => {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('accessToken', 'fixture-only');
      localStorage.setItem('refreshToken', 'fixture-only');
    }, user);
    await page.route('**/api/**', async route => {
      const path = new URL(route.request().url()).pathname, method = route.request().method();
      if (!path.startsWith('/api/')) return route.continue();
      let data = [];
      if (path === '/api/auth/refresh') data = { user, accessToken: 'fixture-only', refreshToken: 'fixture-only' };
      else if (path === '/api/notifications/unread-count') data = { count: 0 };
      else if (path === '/api/study/groups') data = [{ id: '42', name: '프론트엔드 스터디', members, canManage: true }];
      else if (path === '/api/study/photos') data = { attachmentId: nextId++, originalName: 'proof.png' };
      else if (path.startsWith('/api/attachments/')) {
        assert.equal(route.request().headers().authorization, 'Bearer fixture-only');
        return route.fulfill({ status: 200, contentType: 'image/png', body: png });
      } else if (path.startsWith('/api/study/records')) {
        if (method === 'PATCH') {
          if (fail) return route.fulfill({ status: 409, json: {} });
          const body = route.request().postDataJSON();
          record = { ...record, ...body, groupId: '42', version: record.version + 1,
            photos: body.attachmentIds.map(attachmentId => ({ attachmentId, originalName: 'proof.png' })),
            attendance: body.attendance.map(entry => ({ ...entry, userId: String(entry.userId), name: members.find(m => m.userId === String(entry.userId)).name })) };
        }
        data = path === '/api/study/records' ? [record] : record;
      }
      await route.fulfill({ status: 200, json: data });
    });
    const root = 'http://127.0.0.1:3000';
    await page.goto(root + '/community/activity');
    await page.getByRole('radiogroup', { name: '김코알라 출석 상태' }).getByLabel('출석', { exact: true }).check();
    await page.getByRole('radiogroup', { name: '이름이 긴 참여자 출석 상태' }).getByLabel('지각', { exact: true }).check();
    await page.getByLabel('인증 사진 업로드', { exact: true }).setInputFiles({ name: 'proof.png', mimeType: 'image/png', buffer: png });
    await page.getByAltText('proof.png').waitFor();
    await page.waitForFunction(() => [...document.images].filter(i => i.alt === 'proof.png').every(i => i.complete && i.naturalWidth > 0));
    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'attendance overflow ' + width);
      await page.locator('.attendance-session').screenshot({ path: 'design/qa/attendance-session-' + width + '.png' });
    }
    fail = true;
    await page.getByRole('button', { name: '출석 저장', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: '다른 사람이 먼저' }).waitFor();
    assert.equal(await page.getByRole('radiogroup', { name: '김코알라 출석 상태' }).getByLabel('출석', { exact: true }).isChecked(), true);
    fail = false;
    await page.getByRole('button', { name: '출석 저장', exact: true }).click();
    await page.getByText('저장했습니다', { exact: true }).waitFor();
    assert.deepEqual(record.attendance.map(e => e.status), ['present', 'late']);
    assert.equal(record.photos.length, 1);
    await page.reload();
    await page.getByAltText('proof.png').waitFor();
    await page.getByRole('button', { name: '사진 1 삭제', exact: true }).click();
    await page.getByRole('button', { name: '출석 저장', exact: true }).click();
    await page.getByText('저장했습니다', { exact: true }).waitFor();
    assert.equal(record.photos.length, 0);
    record.canManage = false;
    await page.reload();
    await page.getByRole('heading', { name: record.title }).waitFor();
    assert.equal(await page.getByRole('radiogroup').count(), 0);
    assert.equal(await page.getByRole('button', { name: '사진 추가', exact: true }).count(), 0);
    await page.goto(root + '/community/recruit/notices/new');
    await page.getByLabel('모집 역할 1', { exact: true }).fill('스터디원');
    await page.getByLabel('모집 인원 1', { exact: true }).fill('4');
    await page.getByRole('button', { name: '역할 추가', exact: true }).click();
    await page.getByLabel('모집 역할 2', { exact: true }).fill('멘토');
    await page.getByLabel('모집 인원 2', { exact: true }).fill('1');
    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'recruit overflow ' + width);
      await page.locator('.recruit-write-panel').screenshot({ path: 'design/qa/recruit-form-' + width + '.png' });
    }
    await page.getByRole('button', { name: '모집 역할 1 삭제', exact: true }).click();
    assert.equal(await page.getByLabel('모집 역할 1', { exact: true }).inputValue(), '멘토');
    assert.deepEqual(errors, []);
    console.log('PASS attendance choices, authenticated photo preview/upload/remove/reload, conflict preservation, readonly permissions, roles and 4 responsive widths');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
