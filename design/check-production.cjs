const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    const failures = [];
    page.on('pageerror', error => errors.push(error.message));
    let failApi = false;
    await page.route('**/api/**', route => {
      const path = new URL(route.request().url()).pathname;
      if (!path.startsWith('/api/')) return route.continue();
      if (failApi) return route.fulfill({ status: 500, json: { message: 'Request failed' } });
      if (/^\/api\/(users\/\d+|recruits\/[^/]+)$/.test(path)) return route.fulfill({ status: 404, json: { message: 'Not found' } });
      return route.fulfill({ json: path === '/api/site/about' ? { title: '', description: '', chips: [] } : [] });
    });
    fs.mkdirSync('design/qa', { recursive: true });
    const base = 'http://127.0.0.1:3000';
    const paths = ['/', '/login', '/signup', '/email-verification', '/password-reset', '/about', '/community/board', '/community/qna', '/community/info', '/community/recruit', '/services', '/services/user', '/services/official/instance', '/archive/labs', '/archive/agents', '/users'];
    for (const width of [320, 390, 768, 1280, 1800]) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of paths) {
        await page.goto(base + path);
        await page.waitForTimeout(200);
        const geometry = await page.evaluate(() => {
          const auth = document.querySelector('.auth-shell')?.getBoundingClientRect();
          const shell = document.querySelector('.coala-shell')?.getBoundingClientRect();
          return { overflow: document.documentElement.scrollWidth > innerWidth + 1,
            center: auth && shell ? Math.abs(auth.left + auth.width / 2 - (shell.left + shell.width / 2)) : 0,
            intro: document.querySelector('.auth-intro')?.getBoundingClientRect().height ?? 0 };
        });
        if (geometry.overflow || geometry.center > 2 || geometry.intro > 130) failures.push({ width, path, ...geometry });
        if (['/login', '/signup', '/email-verification', '/archive/labs'].includes(path)) {
          await page.screenshot({ path: `design/qa/production-${width}-${path.replace(/\W/g, '_')}.png`, fullPage: true });
        }
      }
    }
    await page.goto(base + '/community/activity?preview=1');
    await page.waitForURL('**/login');
    await page.goto(base + '/community/recruit/notices/react-study');
    await page.getByText('모집 공고를 불러오지 못했습니다.', { exact: true }).waitFor();
    await page.goto(base + '/users/999');
    await page.waitForURL('**/login');
    failApi = true;
    for (const path of ['/', '/community/recruit', '/users', '/archive/labs']) {
      await page.goto(base + path);
      await page.getByText(/불러오지 못했습니다/).first().waitFor();
      assert.equal(await page.locator('.recruit-card, .activity-directory-card, .archive-card, .portal-recruit-item').count(), 0);
    }
    await page.goto(base + '/login');
    await page.getByLabel('이메일', { exact: true }).fill('qa@example.invalid');
    await page.getByLabel('비밀번호', { exact: true }).fill('fixture-only');
    await page.locator('.auth-submit').click();
    await page.locator('.auth-error').waitFor();
    assert.equal(await page.getByLabel('이메일', { exact: true }).inputValue(), 'qa@example.invalid');
    assert.deepEqual(errors, [], 'Browser exceptions');
    assert.deepEqual(failures, [], 'Layout regressions');
    console.log(JSON.stringify({ checks: paths.length * 5, errors, failures, auth: 'centered, compact, responsive', data: 'empty/error/auth guard verified' }));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
