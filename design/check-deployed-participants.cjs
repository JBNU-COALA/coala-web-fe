// Explicit production QA opt-in. Adds only the supplied QA account, then removes the activity.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = new URL(process.env.QA_BASE_URL || 'https://coala.jbnu.ac.kr');
if (base.protocol !== 'https:' || base.username || base.password) throw Error('HTTPS origin required');
if (process.env.QA_WRITE !== '1' || !process.env.QA_EMAIL || !process.env.QA_PASSWORD) throw Error('Explicit QA write opt-in and credentials required');
let token, recordId;
async function api(path, method = 'GET', body) {
  const response = await fetch(new URL(path, base), { method, redirect: 'error', signal: AbortSignal.timeout(20000),
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined });
  assert.ok(response.ok, method + ' ' + path + ': HTTP ' + response.status);
  return response.status === 204 ? null : response.json();
}
(async () => {
  const auth = await api('/api/auth/login', 'POST', { email: process.env.QA_EMAIL, password: process.env.QA_PASSWORD });
  token = auth.accessToken;
  const members = await api('/api/study/members?query=' + encodeURIComponent(auth.user.name));
  const self = members.find(member => member.userId === String(auth.user.id));
  assert.ok(self, 'QA member must be searchable');
  assert.equal(self.email, undefined);
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
    await page.addInitScript(auth => {
      if (localStorage.getItem('refreshToken')) return;
      localStorage.setItem('user', JSON.stringify(auth.user));
      localStorage.setItem('accessToken', auth.accessToken);
      localStorage.setItem('refreshToken', auth.refreshToken);
    }, auth);
    page.on('dialog', dialog => dialog.accept());
    await page.goto(new URL('/community/activity/records/new', base).href);
    await page.getByLabel('제목', { exact: true }).fill('QA-PARTICIPANTS-' + Date.now());
    await page.getByLabel('오늘 어떤 활동을 했나요?').fill('Temporary participant integration check. Removed after testing.');
    await page.getByLabel('참여자 추가', { exact: true }).fill(self.githubId);
    await page.getByRole('button', { name: self.name + ' (' + self.githubId + ') 추가', exact: true }).click();
    await page.getByRole('radiogroup', { name: self.name + ' 출석 상태' }).getByLabel('출석', { exact: true }).check();
    const createdResponse = page.waitForResponse(r => new URL(r.url()).pathname === '/api/study/records' && r.request().method() === 'POST');
    await page.getByRole('button', { name: '기록 저장', exact: true }).click();
    const response = await createdResponse;
    assert.equal(response.status(), 201);
    const created = await response.json();
    recordId = created.id;
    assert.equal(created.groupId, null);
    assert.equal(created.attendance[0].userId, self.userId);
    assert.equal(created.attendance[0].status, 'present');
    await page.waitForURL('**/records/' + recordId + '?*');
    await page.reload();
    await page.getByRole('region', { name: '출석 명단' }).getByText(self.name, { exact: true }).waitFor();
    const records = await api('/api/study/records?from=' + created.date + '&to=' + created.date + '&memberId=' + self.userId);
    assert.ok(records.some(record => record.id === recordId));
    await page.getByRole('link', { name: '수정', exact: true }).click();
    await page.getByRole('button', { name: self.name + ' 참여자 제외', exact: true }).click();
    const changedResponse = page.waitForResponse(r => new URL(r.url()).pathname === '/api/study/records/' + recordId && r.request().method() === 'PATCH');
    await page.getByRole('button', { name: '기록 저장', exact: true }).click();
    assert.equal((await changedResponse).status(), 200);
    assert.deepEqual((await api('/api/study/records/' + recordId)).attendance, []);
    console.log('PASS deployed UI member search, standalone participant addition, attendance save/reload, personal activity lookup and participant removal');
  } finally {
    await browser.close();
    if (recordId) {
      const record = await api('/api/study/records/' + recordId);
      await api('/api/study/records/' + recordId + '?version=' + record.version, 'DELETE');
      console.log('PASS temporary QA activity removed');
    }
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
