const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

// Fixtures exist only in this intercepted browser test, never in the application.
const user = { id: 1, name: '레이아웃 검증 사용자', email: 'fixture@example.invalid', verified: true, role: 'USER' };
const member = { id: '1', name: user.name, initials: '레', role: '회원', grade: '3학년', tone: 'mint', lab: '컴퓨터인공지능학부', githubHandle: '', githubUrl: '', focus: '', bio: '프로필 소개 영역입니다.', activityNote: '', awardNote: '', recentCommit: '', solvedHandle: '', solvedTier: 'unrated', sharedRepos: [], logs: [], awards: [], solvedCount: 0, githubCommits: 0, totalPoints: 0 };
const group = { id: '42', name: '주간 활동을 함께 기록하는 스터디', members: [{ userId: '1', name: user.name }], canManage: true };
const today = new Date().toLocaleDateString('en-CA');
const record = { id: 'layout-record', groupId: '42', title: '긴 제목의 활동 기록에서도 정렬과 줄바꿈을 유지하는지 확인합니다', date: today, updatedAt: new Date().toISOString(), content: '## 이번 주 활동\n마크다운 본문과 출석 기록을 확인합니다.', attendance: [{ userId: '1', name: user.name, status: 'present' }], canManage: true, version: 0 };
const articles = ['news', 'contest', 'lab', 'resource'].map((filter, index) => ({ id: index + 1, title: '긴 제목의 정보공유 글에서 이미지와 본문의 정렬을 확인합니다', filter, meta: filter, imageUrl: '/coala-card-placeholder.png', content: '정보공유 미리보기 본문입니다. 여러 줄이 되어도 이미지는 안정된 크기를 유지합니다.', source: '테스트', viewCount: 1, bookmarkCount: 0, authorId: 1 }));

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage();
    const errors = [], failures = [];
    page.on('pageerror', error => { errors.push(error.message); console.error(page.url(), error.message); });
    await page.addInitScript(user => {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('accessToken', 'fixture-only');
      localStorage.setItem('refreshToken', 'fixture-only');
    }, user);
    await page.route('**/api/**', route => {
      const path = new URL(route.request().url()).pathname;
      if (!path.startsWith('/api/')) return route.continue();
      let data = [];
      if (path === '/api/auth/refresh') data = { user, accessToken: 'fixture-only', refreshToken: 'fixture-only' };
      else if (path === '/api/notifications/unread-count') data = { count: 0 };
      else if (path === '/api/users/1') data = member;
      else if (path === '/api/users') data = [member];
      else if (path === '/api/info') data = articles;
      else if (path === '/api/study/groups') data = [group];
      else if (path === '/api/study/records') data = [record];
      else if (path === '/api/study/records/layout-record') data = record;
      else if (path === '/api/site/about') data = { title: '동아리 소개', description: '실제 저장된 소개가 표시되는 영역의 레이아웃을 검증합니다.', chips: ['프로젝트', '스터디', '서비스 운영'] };
      return route.fulfill({ json: data });
    });
    fs.mkdirSync('design/qa', { recursive: true });
    const paths = ['/', '/about', '/community/board', '/community/info', '/community/recruit', '/community/activity', '/community/activity?layout=calendar', '/community/activity?view=attendance', '/community/activity/records/layout-record', '/users/1', '/services', '/services/official/instance', '/archive/labs'];
    for (const width of [320, 390, 768, 1280, 1800]) {
      await page.setViewportSize({ width, height: 960 });
      for (const path of paths) {
        await page.goto('http://127.0.0.1:3000' + path);
        await page.locator('.page-hero').waitFor();
        if (path === '/users/1') await page.locator('.profile-page-hero').waitFor();
        if (path === '/') await page.locator('.resource-item-button').first().waitFor();
        await page.waitForTimeout(150);
        const issues = await page.evaluate(() => {
          const issues = [];
          const rect = selector => document.querySelector(selector)?.getBoundingClientRect();
          if (document.documentElement.scrollWidth > innerWidth + 1) issues.push('page overflow');
          const hero = rect('.page-hero-inner'), header = rect('.coala-brand');
          if (hero && header && Math.abs(hero.left - header.left) > 2) issues.push(`header/hero alignment ${header.left}/${hero.left}`);
          const nav = rect('.section-nav--context');
          if (nav && hero && Math.abs(nav.left - hero.left) > 2) issues.push('context/hero alignment');
          const body = rect('.page-frame-body');
          if (body && hero && (Math.abs(body.left - hero.left) > 2 || Math.abs(body.width - hero.width) > 2)) issues.push('body/hero alignment');
          for (const tab of document.querySelectorAll('.section-nav-item[aria-current]')) {
            if (getComputedStyle(tab).borderBottomWidth !== '0px') issues.push('duplicate tab underline');
            const strip = tab.parentElement.getBoundingClientRect(), bounds = tab.getBoundingClientRect();
            if (bounds.left < strip.left - 1 || bounds.right > strip.right + 1) issues.push('active tab clipped');
          }
          const text = rect('.page-hero-content'), art = rect('.page-hero-art');
          if (text && art && text.right > art.left + 1) issues.push('hero art overlaps text');
          if (getComputedStyle(document.querySelector('.page-hero')).backgroundColor !== 'rgb(18, 63, 49)') issues.push('inconsistent banner background');
          for (const item of document.querySelectorAll('.resource-item:not(:first-child) .resource-item-button')) {
            const image = item.querySelector('.resource-thumbnail').getBoundingClientRect();
            const bounds = item.getBoundingClientRect();
            if (Math.abs(image.top - bounds.top) > 1 || Math.abs(image.bottom - bounds.bottom) > 1) issues.push('floating resource image');
          }
          return issues;
        });
        if (issues.length) failures.push({ width, path, issues });
        await page.screenshot({ path: `design/qa/layout-${width}-${path.replace(/\W/g, '_')}.png`, fullPage: true });
      }
    }
    await page.goto('http://127.0.0.1:3000/community/recruit');
    await page.getByRole('navigation', { name: '모집 메뉴', exact: true }).getByRole('button', { name: '관심 공고', exact: true }).click();
    await page.waitForURL('**/community/recruit?view=saved');
    await page.getByRole('navigation', { name: '모집 메뉴', exact: true }).getByRole('button', { name: '내 공고', exact: true }).click();
    await page.waitForURL('**/community/recruit?view=manage');
    await page.goto('http://127.0.0.1:3000/community/activity');
    await page.getByRole('button', { name: '캘린더형', exact: true }).click();
    await page.waitForURL('**/community/activity?layout=calendar');
    await page.getByRole('button', { name: '출석 현황', exact: true }).click();
    await page.getByText('선택한 주의 활동', { exact: false }).waitFor();
    await page.goto('http://127.0.0.1:3000/users/1');
    await page.getByRole('navigation', { name: '프로필 메뉴' }).getByRole('button', { name: '수상 내역' }).click();
    for (const width of [320, 1280, 390]) {
      await page.setViewportSize({ width, height: 960 });
      await page.waitForTimeout(150);
      assert.ok(await page.evaluate(() => [...document.querySelectorAll('.section-nav-item[aria-current]')].every(item => {
        const box = item.getBoundingClientRect(), parent = item.parentElement.getBoundingClientRect();
        return box.left >= parent.left - 1 && box.right <= parent.right + 1;
      })), 'Selected navigation remains visible after viewport changes');
    }
    assert.deepEqual(errors, [], 'Browser exceptions');
    assert.deepEqual(failures, [], 'Visual contract failures');
    console.log(`PASS: ${paths.length * 5} populated-page layout checks; aligned frames, single tab underline, visible selected tabs, contained media`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
