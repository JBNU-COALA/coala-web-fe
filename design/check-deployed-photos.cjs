// Explicit opt-in; uses a temporary QA activity and cleans it up.
const assert = require('node:assert/strict');
const base = new URL(process.env.QA_BASE_URL || 'https://coala.jbnu.ac.kr');
if (base.protocol !== 'https:' || base.username || base.password) throw new Error('HTTPS origin required');
if (process.env.QA_WRITE !== '1' || !process.env.QA_EMAIL || !process.env.QA_PASSWORD) throw new Error('QA_WRITE=1 and QA credentials required');
let token, record, photo;
async function api(path, method = 'GET', body, authenticated = true) {
  const multipart = body instanceof FormData;
  const response = await fetch(new URL(path, base), { method, redirect: 'error', signal: AbortSignal.timeout(20000),
    headers: { ...(body && !multipart ? { 'Content-Type': 'application/json' } : {}), ...(authenticated && token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body ? multipart ? body : JSON.stringify(body) : undefined });
  return response;
}
async function json(path, method, body) {
  const response = await api(path, method, body);
  assert.ok(response.ok, method + ' ' + path + ' HTTP ' + response.status);
  return response.json();
}
(async () => {
  try {
    const auth = await json('/api/auth/login', 'POST', { email: process.env.QA_EMAIL, password: process.env.QA_PASSWORD });
    assert.ok(auth.user.verified);
    token = auth.accessToken;
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=', 'base64');
    const body = new FormData();
    body.append('file', new Blob([png], { type: 'image/png' }), 'qa-proof.png');
    photo = await json('/api/study/photos', 'POST', body);
    assert.ok(photo.attachmentId);
    const photoPath = '/api/attachments/' + photo.attachmentId + '/download';
    const anonymousTemp = await api(photoPath, 'GET', undefined, false);
    assert.ok([401,403].includes(anonymousTemp.status));
    const payload = { groupId: null, title: 'QA-PHOTO-' + Date.now(), date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' }),
      content: 'Temporary photo integration verification. Removed after testing.', attendance: [], attachmentIds: [photo.attachmentId] };
    record = await json('/api/study/records', 'POST', payload);
    assert.equal(record.photos[0].attachmentId, photo.attachmentId);
    const authenticated = await api(photoPath);
    assert.equal(authenticated.status, 200);
    assert.equal(authenticated.headers.get('cache-control'), 'private, no-store');
    assert.ok((await authenticated.arrayBuffer()).byteLength > 0);
    const anonymous = await api(photoPath, 'GET', undefined, false);
    assert.ok([401,403].includes(anonymous.status));
    const legacy = { ...payload, title: payload.title + ' edited', version: record.version };
    delete legacy.attachmentIds;
    record = await json('/api/study/records/' + record.id, 'PATCH', legacy);
    assert.equal(record.photos.length, 1, 'Legacy edit must keep photos');
    const reloaded = await json('/api/study/records/' + record.id);
    assert.equal(reloaded.photos[0].attachmentId, photo.attachmentId);
    record = await json('/api/study/records/' + record.id, 'PATCH', { ...payload, version: record.version, attachmentIds: [] });
    assert.equal(record.photos.length, 0);
    assert.equal((await api(photoPath)).status, 404);
    console.log('PASS deployed photo upload, activity attachment, authenticated download, anonymous rejection, edit retention, reload, removal');
  } finally {
    if (record) {
      const current = await json('/api/study/records/' + record.id);
      const response = await api('/api/study/records/' + record.id + '?version=' + current.version, 'DELETE');
      assert.equal(response.status, 204);
      console.log('PASS QA activity cleanup');
    } else if (photo) {
      console.log('Unattached TEMP upload remains subject to scheduled cleanup; attachment ID:', photo.attachmentId);
    }
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
