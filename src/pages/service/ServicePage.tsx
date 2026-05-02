import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Icon } from '../../shared/ui/Icon'
import { JcloudAdminPanel } from './JcloudAdminPanel'
import { JcloudApplyForm } from './JcloudApplyForm'
import { JcloudApplyList } from './JcloudApplyList'
import { inquiryItems } from './serviceData'

type ServiceTab = 'apply' | 'list' | 'inquiry' | 'admin'

type ServicePageProps = {
  embedded?: boolean
}

const IS_ADMIN = true

export function ServicePage({ embedded = false }: ServicePageProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('instanceTab') === 'inquiry' ? 'inquiry' : 'apply'
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
    if (!embedded) {
      setSearchParams(nextTab === 'inquiry' ? { instanceTab: 'inquiry' } : {})
    }
  }

  const content = (
    <>
      {!embedded ? (
        <div className="jcloud-hero">
          <div className="jcloud-hero-body">
            <span className="jcloud-hero-badge">인스턴스</span>
            <h2 className="jcloud-hero-title">코알라 인스턴스 신청</h2>
          </div>
        </div>
      ) : null}

      <div className="jcloud-tab-shell surface-card">
        <div className="jcloud-tab-bar">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`jcloud-tab-btn${tab === item.id ? ' is-active' : ''}`}
              onClick={() => changeTab(item.id)}
            >
              <Icon name={item.icon} size={14} />
              {item.label}
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
    </>
  )

  if (embedded) {
    return <div className="services-instance-panel">{content}</div>
  }

  return <section className="coala-content coala-content--service">{content}</section>
}

function InstanceInquiryPanel() {
  const [isWriting, setIsWriting] = useState(false)

  return (
    <section className="jcloud-inquiry-shell">
      <header className="jcloud-inquiry-header">
        <div>
          <h3 className="jcloud-form-section-title">문의사항</h3>
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
            <textarea className="jcloud-textarea" rows={4} placeholder="문의 내용을 입력하세요" />
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
