import { useState } from 'react'
import { Icon } from '../../shared/ui/Icon'
import { JcloudApplyForm } from './JcloudApplyForm'
import { JcloudApplyList } from './JcloudApplyList'
import { JcloudAdminPanel } from './JcloudAdminPanel'

type ServiceTab = 'apply' | 'list' | 'admin'

// 실제 서비스에선 useAuth()로 isAdmin 확인
const IS_ADMIN = true

export function ServicePage() {
  const [tab, setTab] = useState<ServiceTab>('apply')

  const tabs: { id: ServiceTab; label: string; icon: Parameters<typeof Icon>[0]['name'] }[] = [
    { id: 'apply', label: '신청하기', icon: 'plus' },
    { id: 'list', label: '신청 내역', icon: 'file' },
    ...(IS_ADMIN
      ? [{ id: 'admin' as ServiceTab, label: '관리자', icon: 'settings' as const }]
      : []),
  ]

  return (
    <section className="coala-content coala-content--service">
      <div className="jcloud-hero">
        <div className="jcloud-hero-body">
          <span className="jcloud-hero-badge">JCLOUD</span>
          <h2 className="jcloud-hero-title">
            인스턴스를 신청하고
            <br />
            프로젝트를 바로 시작하세요.
          </h2>
          <p className="jcloud-hero-subtitle">
            코알라 부원을 위한 클라우드 인스턴스 대여 서비스입니다.
            학습, 프로젝트, AI 모델 학습 등 다양한 목적으로 활용할 수 있어요.
          </p>
          <div className="jcloud-hero-stats">
            <div className="jcloud-hero-stat">
              <span className="jcloud-hero-stat-value">5</span>
              <span className="jcloud-hero-stat-label">인스턴스 유형</span>
            </div>
            <div className="jcloud-hero-stat-divider" />
            <div className="jcloud-hero-stat">
              <span className="jcloud-hero-stat-value">24h</span>
              <span className="jcloud-hero-stat-label">평균 승인 시간</span>
            </div>
            <div className="jcloud-hero-stat-divider" />
            <div className="jcloud-hero-stat">
              <span className="jcloud-hero-stat-value">무료</span>
              <span className="jcloud-hero-stat-label">부원 혜택</span>
            </div>
          </div>
        </div>
        <div className="jcloud-hero-deco" aria-hidden="true">☁️</div>
      </div>

      <div className="jcloud-tab-shell surface-card">
        <div className="jcloud-tab-bar">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`jcloud-tab-btn${tab === t.id ? ' is-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <Icon name={t.icon} size={14} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="jcloud-tab-content">
          {tab === 'apply' ? (
            <JcloudApplyForm onSubmit={() => setTab('list')} />
          ) : tab === 'list' ? (
            <JcloudApplyList />
          ) : (
            <JcloudAdminPanel />
          )}
        </div>
      </div>
    </section>
  )
}
