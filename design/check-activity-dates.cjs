const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { spawnSync } = require('node:child_process');
const ts = require('typescript');

if (!process.env.ACTIVITY_DATE_TEST_CHILD) {
  for (const TZ of ['UTC', 'Asia/Seoul', 'America/Los_Angeles', 'Pacific/Auckland']) {
    const result = spawnSync(process.execPath, [__filename], {
      env: { ...process.env, TZ, ACTIVITY_DATE_TEST_CHILD: '1' }, encoding: 'utf8'
    });
    assert.equal(result.status, 0, result.stderr);
    process.stdout.write(result.stdout);
  }
} else {
  const source = readFileSync(resolve(__dirname, '../src/shared/activity.ts'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  const exports = {};
  new Function('exports', compiled.outputText)(exports);
  const { activityToday, mondayOf, shiftDate } = exports;
  assert.equal(activityToday(new Date('2026-09-20T14:59:59Z')), '2026-09-20');
  assert.equal(activityToday(new Date('2026-09-20T15:00:00Z')), '2026-09-21');
  assert.equal(activityToday(new Date('2026-12-31T15:00:00Z')), '2027-01-01');
  assert.equal(mondayOf(activityToday(new Date('2026-09-20T15:00:00Z'))), '2026-09-21');
  assert.equal(shiftDate('2026-09-21', -1), '2026-09-20');
  console.log('PASS activity calendar boundaries in ' + process.env.TZ);
}
