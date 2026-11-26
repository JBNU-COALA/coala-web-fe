import { useEffect, useState } from 'react'
import { Icon } from '../../../shared/ui/Icon'
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner'
import { ctfInstanceHref } from './api'
import type { CtfInstance } from './types'
import { EducationEmptyState } from '../EducationEmptyState'

export function CtfResourceState({ loading, error, retry }: { loading: boolean; error: string | null; retry: () => void }) {
  if (loading) return <LoadingSpinner label="실습 자료를 불러오는 중..." />
  if (!error) return null
  return <div role="alert"><EducationEmptyState icon="network" title={error} action={<button type="button" className="education-button" onClick={retry}><Icon name="refresh" size={16} />다시 시도</button>} /></div>
}

export function CtfInstancePanel({ instance }: { instance: CtfInstance }) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  const raw = instance.expires_at
  const date = new Date(/Z$|[+-]\d{2}:?\d{2}$/.test(raw) ? raw : `${raw.replace(' ', 'T')}Z`)
  const seconds = Math.max(0, Math.ceil((date.getTime() - now) / 1000))
  const expired = Number.isFinite(seconds) && seconds === 0
  const href = ctfInstanceHref(instance)
  return <div className="ctf-instance-status">
    <strong>{instance.dry_run ? '개발 모드 · 실제 실습 환경 없음' : expired ? '만료된 실습 환경' : '실습 환경 실행 중'}</strong>
    <span>{Number.isFinite(seconds) ? `남은 시간 ${Math.floor(seconds / 60)}분 ${seconds % 60}초` : '만료 시간 확인 불가'}</span>
    {!instance.dry_run && !expired && (href
      ? <a className="education-text-link" href={href} target="_blank" rel="noopener noreferrer">실습 환경 열기 <span className="sr-only">(새 탭)</span><Icon name="link" size={14} /></a>
      : instance.kind === 'tcp' ? <code className="ctf-connection">{`nc ${instance.host} ${instance.port}`}</code> : null)}
  </div>
}
