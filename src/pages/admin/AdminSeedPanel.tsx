import { useState } from 'react'
import { adminEducationApi } from '../../shared/api/adminEducation'
import { featureError } from '../../shared/api/featureError'
import { useApiResource } from '../../shared/hooks/useApiResource'
import { Icon } from '../../shared/ui/Icon'

export function AdminSeedPanel({ onInstalled }: { onInstalled?: () => void }) {
  const [revision, setRevision] = useState(0)
  const seed = useApiResource(adminEducationApi.seed, revision)
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const install = async () => {
    if (busy) return
    setBusy(true); setMessage(''); setError('')
    try { const result = await adminEducationApi.install(); setMessage(`등록 완료 · 문제 ${result.challengesCreated} · 과정 ${result.coursesCreated} · 첨부 ${result.assetsCreated ?? 0}`); setConfirm(false); setRevision((value) => value + 1); onInstalled?.() }
    catch (cause) { setError(featureError(cause)) } finally { setBusy(false) }
  }
  const data = seed.data
  const missing = (data?.missingChallenges ?? 0) + (data?.missingCourses ?? 0) + (data?.missingAssets ?? 0)
  return <section className="admin-bootstrap" aria-label="기본 교육팩">
    <div className="admin-section-heading"><div><span className="admin-eyebrow">교육 데이터</span><h3>기본 교육팩</h3></div><span className={`admin-state ${data?.available ? missing ? 'is-warning' : 'is-ready' : ''}`}>{seed.loading ? '확인 중' : data?.available ? missing ? '미등록 항목 있음' : '등록 완료' : '서버 설정 필요'}</span></div>
    {data?.available && <div className="admin-metric-band"><div><span>CTF 문제</span><strong>{data.challenges}</strong><small>미등록 {data.missingChallenges}</small></div><div><span>과정 · 문서</span><strong>{data.courses}</strong><small>미등록 {data.missingCourses}</small></div><div><span>첨부 파일</span><strong>{data.assets}</strong><small>미등록 {data.missingAssets}</small></div></div>}
    {seed.error && <p className="admin-error" role="alert">{seed.error}</p>}{error && <p className="admin-error" role="alert">{error}</p>}{message && <p className="admin-feedback" role="status">{message}</p>}
    <div className="admin-row-actions"><button type="button" className="admin-ghost-button" title="등록 상태 새로고침" aria-label="등록 상태 새로고침" disabled={busy} onClick={() => setRevision((value) => value + 1)}><Icon name="refresh" size={15} /></button><button type="button" className="admin-primary-button" disabled={!data?.available || missing === 0 || busy} onClick={() => setConfirm(true)}><Icon name="plus" size={15} />{busy ? '등록 중...' : '미등록 데이터 등록'}</button></div>
    {confirm && <div className="admin-confirm" role="alertdialog" aria-label="기본 교육팩 등록 확인"><h4>미등록 데이터를 등록할까요?</h4><p>기존 콘텐츠와 학습 기록은 유지됩니다.</p><div className="admin-row-actions"><button type="button" disabled={busy} onClick={() => setConfirm(false)}>취소</button><button type="button" className="admin-primary-button" disabled={busy} onClick={() => void install()}>등록</button></div></div>}
  </section>
}
