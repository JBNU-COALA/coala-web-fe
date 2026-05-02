import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Icon } from '../../shared/ui/Icon'
import { JcloudApplyForm } from './JcloudApplyForm'
import { JcloudApplyList } from './JcloudApplyList'
import { JcloudAdminPanel } from './JcloudAdminPanel'
import { inquiryItems } from './serviceData'

type ServiceTab = 'apply' | 'list' | 'inquiry' | 'admin'

// 실제 서비스에선 useAuth()로 isAdmin 확인
const IS_ADMIN = true

export function ServicePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') === 'inquiry' ? 'inquiry' : 'apply'
  const [tab, setTab] = useState<ServiceTab>(initialTab)

  const tabs: { id: ServiceTab; label: string; icon: Parameters<typeof Icon>[0]['name'] }[] = [
    { id: 'apply', label: '신청하기', icon: 'plus' },
    { id: 'list', label: '신청 내역', icon: 'file' },
    { id: 'inquiry', label: '문의사항', icon: 'message' },
    ...(IS_ADMIN
      ? [{ id: 'admin' as ServiceTab, label: '관리자', icon: 'settings' as const }]
      : []),
  ]

  const changeTab = (nextTab: ServiceTab) => {
    setTab(nextTab)
    setSearchParams(nextTab === 'inquiry' ? { tab: 'inquiry' } : {})
  }

  return (
    <section className="coala-content coala-content--service">
      <div className="jcloud-hero">
        <div className="jcloud-hero-body">
          <span className="jcloud-hero-badge">인스턴스</span>
          <h2 className="jcloud-hero-title">
            코알라 프로젝트에 활용한
            <br />
            인스턴스를 대여하세요.
          </h2>
          <p className="jcloud-hero-subtitle">
            프로젝트 배포, 실습 서버, AI 실험 환경에 필요한 인스턴스 신청과 문의를 한 곳에서 확인합니다.
          </p>
        </div>
        <div className="jcloud-hero-panel" aria-label="인스턴스 운영 요약">
          <div className="jcloud-hero-panel-head">
            <span>포털 연결</span>
            <strong>Gateway</strong>
          </div>
          <ul className="jcloud-hero-panel-list">
            <li>신청하기</li>
            <li>신청 내역</li>
            <li>문의사항</li>
          </ul>
          <p className="jcloud-hero-panel-text">
            실서비스 처리는 별도 대여 서비스에서 담당하며, 이 포털은 인스턴스 대여 진입점으로 노출합니다.
          </p>
        </div>
      </div>

      <div className="jcloud-tab-shell surface-card">
        <div className="jcloud-tab-bar">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`jcloud-tab-btn${tab === t.id ? ' is-active' : ''}`}
              onClick={() => changeTab(t.id)}
            >
              <Icon name={t.icon} size={14} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="jcloud-tab-content">
          {tab === 'apply' ? (
            <JcloudApplyForm onSubmit={() => changeTab('list')} />
          ) : tab === 'list' ? (
            <JcloudApplyList />
          ) : tab === 'inquiry' ? (
            <InstanceInquiryPanel />
          ) : (
            <JcloudAdminPanel />
          )}
        </div>
      </div>
    </section>
  )
}

function InstanceInquiryPanel() {
  const [isWriting, setIsWriting] = useState(false)

  return (
    <section className="jcloud-inquiry-shell">
      <header className="jcloud-inquiry-header">
        <div>
          <h3 className="jcloud-form-section-title">문의사항</h3>
          <p>다른 사용자가 남긴 인스턴스 대여 문의와 처리 상태를 확인합니다.</p>
        </div>
        <button
          type="button"
          className="write-post-button write-post-button--inquiry"
          onClick={() => setIsWriting((value) => !value)}
        >
          <Icon name="edit" size={15} />
          문의사항 쓰기
        </button>
      </header>

      {isWriting ? (
        <form className="jcloud-inquiry-form">
          <label className="jcloud-field">
            <span className="jcloud-label">제목</span>
            <input className="jcloud-input" placeholder="문의 제목을 입력하세요" />
          </label>
          <label className="jcloud-field">
            <span className="jcloud-label">내용</span>
            <textarea
              className="jcloud-textarea"
              rows={4}
              placeholder="대여 목적, 필요한 기간, 확인이 필요한 내용을 적어주세요."
            />
          </label>
          <button type="button" className="jcloud-submit-button">
            문의 등록
          </button>
        </form>
      ) : null}

      <ul className="jcloud-inquiry-list">
        {inquiryItems.map((item) => (
          <li key={item.id} className="jcloud-inquiry-item surface-card">
            <div>
              <span className={`jcloud-status-badge ${item.statusClass}`}>{item.status}</span>
              <h4>{item.title}</h4>
              <p>{item.summary}</p>
            </div>
            <span className="jcloud-inquiry-meta">{item.author} · {item.createdAt}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
