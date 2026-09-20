const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  fs.mkdirSync('design/qa', { recursive: true });
  const base = 'http://127.0.0.1:3000';
  const paths = ['/', '/about', '/community/board', '/community/info', '/community/qna', '/community/recruit', '/community/recruit/notices/react-study', '/services', '/services/user', '/services/official/instance', '/users', '/community/activity?preview=1', '/community/activity?preview=1&layout=calendar', '/community/activity/records/1?preview=1', '/community/activity/records/new?preview=1'];
  const overflow = [];
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 850 });
    for (const path of paths) {
      await page.goto(base + path);
      await page.waitForTimeout(350);
      const extra = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth, nodes: [...document.querySelectorAll('main *')].filter(el => el.getBoundingClientRect().right > innerWidth + 2 && getComputedStyle(el).position !== 'absolute').slice(0, 6).map(el => el.className) }));
      if (extra.width > width + 2) overflow.push({ width, path, ...extra });
      if (path.includes('activity') || (width === 390 && path.includes('recruit'))) await page.screenshot({ path: `design/qa/${width}-${path.replace(/[^a-z0-9]/gi, '_')}.png`, fullPage: true });
    }
  }
  await page.setViewportSize({ width: 390, height: 850 });
  await page.goto(base + '/community/activity?preview=1');
  await page.getByRole('link', { name: '기록 작성', exact: true }).click();
  await page.getByLabel('제목', { exact: true }).fill('출석 연결 테스트');
  await page.getByLabel('오늘 어떤 활동을 했나요?').fill('## 활동 내용\n모집에서 활동으로 연결합니다.');
  await page.getByRole('button', { name: '전체 출석', exact: true }).click();
  await page.getByRole('button', { name: '기록 저장', exact: true }).click();
  await page.getByRole('heading', { name: '출석 연결 테스트', exact: true }).waitFor();
  await page.getByRole('link', { name: '수정', exact: true }).click();
  assert.equal(await page.getByLabel('제목', { exact: true }).inputValue(), '출석 연결 테스트');
  await page.getByLabel('제목', { exact: true }).fill('출석 수정 완료');
  await page.getByRole('button', { name: '기록 저장', exact: true }).click();
  await page.getByRole('heading', { name: '출석 수정 완료', exact: true }).waitFor();
  await page.reload();
  await page.getByRole('heading', { name: '출석 수정 완료', exact: true }).waitFor();
  await page.goto(base + '/community/activity');
  await page.waitForURL('**/login');
  console.log(JSON.stringify({ overflow, errors, checks: ['create', 'edit', 'reload', 'auth guard'], screenshots: 'design/qa' }, null, 2));
  await browser.close();
  assert.equal(overflow.length, 0, 'Responsive overflow');
  assert.equal(errors.length, 0, 'Browser errors');
})().catch(error => { console.error(error); process.exit(1); });
