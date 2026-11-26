import { analyticsConfigured } from '../../shared/analytics/analytics'
import { dashboardEmbedUrl } from '../../shared/analytics/policy'
import { useEffect, useRef, useState } from 'react'

export function AdminAnalyticsPanel() {
  const embed = dashboardEmbedUrl(import.meta.env.VITE_POSTHOG_DASHBOARD_EMBED_URL)
  const frame = useRef<HTMLIFrameElement>(null)
  const [connection, setConnection] = useState<'connecting' | 'live' | 'offline'>('connecting')
  const [frameVersion, setFrameVersion] = useState(0)
  useEffect(() => {
    if (!embed) return
    const timer = window.setTimeout(() => setConnection(value => value === 'connecting' ? 'offline' : value), 20000)
    const message = (event: MessageEvent) => {
      if (event.origin !== new URL(embed).origin || event.source !== frame.current?.contentWindow) return
      if (event.data?.event === 'posthog:dimensions' && event.data?.name === 'coala-analytics' && navigator.onLine) {
        setConnection('live')
        window.clearTimeout(timer)
      }
    }
    const offline = () => setConnection('offline')
    const online = () => { setConnection('connecting'); setFrameVersion(value => value + 1) }
    window.addEventListener('message', message)
    window.addEventListener('offline', offline)
    window.addEventListener('online', online)
    return () => { window.clearTimeout(timer); window.removeEventListener('message', message); window.removeEventListener('offline', offline); window.removeEventListener('online', online) }
  }, [embed, frameVersion])
  const appUrl = import.meta.env.VITE_POSTHOG_HOST === 'https://eu.i.posthog.com' ? 'https://eu.posthog.com' : 'https://us.posthog.com'
  return <section className="admin-panel admin-analytics">
    <div className="admin-panel-header"><h3>사용 분석 {embed && <span className={`admin-analytics-status is-${connection}`} role="status" title="대시보드 로드 연결 상태입니다. 이벤트 수집 성공이나 차트의 실시간 갱신 여부를 의미하지 않습니다."><i aria-hidden="true" />{connection === 'live' ? 'Live' : connection === 'offline' ? '연결 확인 필요' : '연결 중'}</span>}</h3><a className="admin-ghost-button" href={appUrl} target="_blank" rel="noreferrer">PostHog 열기</a></div>
    {embed ? <>
      <iframe ref={frame} key={`${embed}-${frameVersion}`} name="coala-analytics" src={embed} title="코알라 사용 분석 대시보드" className="admin-analytics-frame" referrerPolicy="no-referrer" onError={() => setConnection('offline')} allowFullScreen sandbox="allow-scripts allow-same-origin allow-popups" />
    </> : !analyticsConfigured ? <div className="admin-analytics-setup">
      <h4>PostHog 프로젝트를 연결해 주세요.</h4>
      <p>프로젝트 연결 후 페이지 이용량, 메뉴 이동, 글 작성과 신청 완료를 분석할 수 있습니다.</p>
      <ol><li>PostHog에서 코알라 프로젝트를 만드세요.</li><li>프로젝트 토큰과 서버 주소를 배포 설정에 등록하세요.</li><li>집계 대시보드를 만들고 임베드 주소를 연결하세요.</li></ol>
      <p>아직 데이터를 수집하지 않습니다. 관리자 화면과 개인정보 입력값은 수집 대상에서 제외됩니다.</p>
    </div> : <div className="admin-analytics-setup"><h4>집계 대시보드 연결이 필요합니다.</h4><p>수집 설정이 등록되어 있습니다. PostHog에서 이벤트 수신을 확인한 뒤 집계 대시보드의 임베드 주소를 연결하세요.</p><p>공유 대시보드는 링크를 아는 사람이 볼 수 있으므로 집계 통계만 포함하세요. 비공개 분석은 PostHog에서 로그인 후 이용하세요.</p></div>}
  </section>
}
