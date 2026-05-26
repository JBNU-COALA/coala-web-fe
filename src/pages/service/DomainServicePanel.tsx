import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../shared/ui/Icon'
import { servicesApi, type DomainApplication, type ServiceInquiry } from '../../shared/api/services'
import { useAuth } from '../../shared/auth/AuthContext'
import { statusMeta, type ApplyStatus } from './serviceData'
import { DomainApplyForm } from './DomainApplyForm'

type DomainTab = 'apply' | 'list' | 'inquiry'

const domainTabs: { id: DomainTab; label: string; icon: Parameters<typeof Icon>[0]['name'] }[] = [
  { id: 'apply', label: '신청하기', icon: 'plus' },
  { id: 'list', label: '신청 내역', icon: 'file' },
  { id: 'inquiry', label: '문의사항', icon: 'message' },
]

const statusFilters: { id: 'all' | ApplyStatus; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'pending', label: '검토 중' },
  { id: 'approved', label: '승인' },
  { id: 'rejected', label: '반려' },
]

export function DomainServicePanel() {
  const [tab, setTab] = useState<DomainTab>('apply')

  return (
    <div className="services-instance-panel">
      <div className="jcloud-tab-shell surface-card">
        <div className="jcloud-tab-bar">
          {domainTabs.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`jcloud-tab-btn${tab === item.id ? ' is-active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              <Icon name={item.icon} size={14} />
              {item.label}
            </button>
          ))}
        </div>
        <div className="jcloud-tab-content">
          {tab === 'apply' ? (
            <DomainApplyForm onSubmit={() => setTab('list')} />
          ) : tab === 'list' ? (
            <DomainApplyList />
          ) : (
            <DomainInquiryPanel />
          )}
        </div>
      </div>
    </div>
  )
}

function DomainApplyList() {
  const { isLoggedIn } = useAuth()
  const [filter, setFilter] = useState<'all' | ApplyStatus>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [applications, setApplications] = useState<DomainApplication[]>([])

  useEffect(() => {
    if (!isLoggedIn) {
      Promise.resolve().then(() => setApplications([]))
      return
    }

    servicesApi.getDomainApplications()
      .then(setApplications)
      .catch(() => setApplications([]))
  }, [isLoggedIn])

  if (!isLoggedIn) {
    return <DomainLoginRequired message="도메인 신청 내역은 로그인 후 확인할 수 있습니다." />
  }

  const items = filter === 'all'
    ? applications
    : applications.filter((application) => application.status === filter)

  return (
    <div className="jcloud-list-shell">
      <div className="jcloud-list-toolbar">
        <ul className="jcloud-filter-tabs">
          {statusFilters.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`jcloud-filter-tab${filter === item.id ? ' is-active' : ''}`}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
        <span className="jcloud-list-count">{items.length}건</span>
      </div>

      {items.length === 0 ? (
        <div className="jcloud-list-empty">
          <Icon name="link" size={28} />
          <p>도메인 신청 내역이 없습니다.</p>
        </div>
      ) : (
        <ul className="jcloud-apply-list">
          {items.map((application) => (
            <DomainApplicationItem
              key={application.id}
              application={application}
              isExpanded={expandedId === application.id}
              onToggle={() => setExpandedId((current) => (current === application.id ? null : application.id))}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function DomainApplicationItem({
  application,
  isExpanded,
  onToggle,
}: {
  application: DomainApplication
  isExpanded: boolean
  onToggle: () => void
}) {
  const meta = statusMeta[application.status]

  return (
    <li className={`jcloud-apply-item surface-card${isExpanded ? ' is-expanded' : ''}`}>
      <button type="button" className="jcloud-apply-item-header" onClick={onToggle}>
        <div className="jcloud-apply-item-main">
          <span className={`jcloud-status-badge ${meta.colorClass}`}>{meta.label}</span>
          <span className="jcloud-apply-instance">{application.serviceName}</span>
          <span className="jcloud-apply-duration">{application.desiredAddress}</span>
        </div>
        <div className="jcloud-apply-item-meta">
          <span className="jcloud-apply-date">{application.requestedAt} 신청</span>
          <Icon
            name={isExpanded ? 'chevron-down' : 'chevron-right'}
            size={14}
            className="jcloud-apply-chevron"
          />
        </div>
      </button>

      {isExpanded ? (
        <div className="jcloud-apply-item-body">
          <div className="jcloud-apply-detail-grid">
            <div className="jcloud-apply-detail-row">
              <span className="jcloud-detail-label">신청 주소</span>
              <span className="jcloud-detail-value">{application.requestedDomain}</span>
            </div>
            <div className="jcloud-apply-detail-row">
              <span className="jcloud-detail-label">공개 저장소</span>
              <a className="jcloud-detail-value" href={application.repositoryUrl} target="_blank" rel="noreferrer">
                {application.repositoryUrl}
              </a>
            </div>
            {application.targetUrl ? (
              <div className="jcloud-apply-detail-row">
                <span className="jcloud-detail-label">연결 대상</span>
                <a className="jcloud-detail-value" href={application.targetUrl} target="_blank" rel="noreferrer">
                  {application.targetUrl}
                </a>
              </div>
            ) : null}
            <div className="jcloud-apply-detail-row">
              <span className="jcloud-detail-label">신청 사유</span>
              <span className="jcloud-detail-value">{application.purpose}</span>
            </div>
          </div>

          {application.adminNote ? (
            <div className={`jcloud-admin-note jcloud-admin-note--${application.status}`}>
              <Icon name="message" size={13} />
              <p>{application.adminNote}</p>
            </div>
          ) : null}

          <div className="jcloud-mail-notice">
            <Icon name="message" size={14} />
            <div>
              <strong>처리 결과를 확인해주세요.</strong>
              <p>승인 또는 반려 처리 결과는 신청 내역과 연락 메일을 통해 안내됩니다.</p>
            </div>
          </div>
        </div>
      ) : null}
    </li>
  )
}

function DomainInquiryPanel() {
  const { isLoggedIn, user } = useAuth()
  const [isWriting, setIsWriting] = useState(false)
  const [inquiries, setInquiries] = useState<ServiceInquiry[]>([])
  const [draft, setDraft] = useState({ title: '', content: '' })

  useEffect(() => {
    if (!isLoggedIn) {
      Promise.resolve().then(() => setInquiries([]))
      return
    }

    servicesApi.getDomainInquiries()
      .then(setInquiries)
      .catch(() => setInquiries([]))
  }, [isLoggedIn])

  if (!isLoggedIn) {
    return <DomainLoginRequired message="도메인 문의사항은 로그인 후 작성할 수 있습니다." />
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft.title.trim() || !draft.content.trim()) return

    try {
      const created = await servicesApi.createDomainInquiry({
        title: draft.title.trim(),
        content: draft.content.trim(),
        author: user?.name ?? user?.email ?? undefined,
      })
      setInquiries((current) => [created, ...current])
      setDraft({ title: '', content: '' })
      setIsWriting(false)
    } catch {
      // 입력값은 유지해 재시도할 수 있게 둔다.
    }
  }

  return (
    <section className="jcloud-inquiry-shell">
      <header className="jcloud-inquiry-header">
        <div>
          <h3 className="jcloud-form-section-title">도메인 문의사항</h3>
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
        <form className="jcloud-inquiry-form" onSubmit={handleSubmit}>
          <label className="jcloud-field">
            <span className="jcloud-label">제목</span>
            <input
              className="jcloud-input"
              placeholder="문의 제목을 입력하세요"
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            />
          </label>
          <label className="jcloud-field">
            <span className="jcloud-label">내용</span>
            <textarea
              className="jcloud-textarea"
              rows={4}
              placeholder="문의 내용을 입력하세요"
              value={draft.content}
              onChange={(event) => setDraft({ ...draft, content: event.target.value })}
            />
          </label>
          <button type="submit" className="jcloud-submit-button">
            문의 등록
          </button>
        </form>
      ) : null}

      <ul className="jcloud-inquiry-list">
        {inquiries.map((item) => (
          <li key={item.id} className="jcloud-inquiry-item surface-card">
            <div>
              <span className={`jcloud-status-badge ${item.statusClass}`}>{item.status}</span>
              <h4>{item.title}</h4>
              <p>{item.summary}</p>
            </div>
            <span className="jcloud-inquiry-meta">{item.author} · {item.createdAt}</span>
          </li>
        ))}
        {inquiries.length === 0 ? (
          <li className="jcloud-list-empty">
            <Icon name="message" size={28} />
            <p>등록된 도메인 문의가 없습니다.</p>
          </li>
        ) : null}
      </ul>
    </section>
  )
}

function DomainLoginRequired({ message }: { message: string }) {
  return (
    <div className="jcloud-login-required">
      <div className="jcloud-success-icon">
        <Icon name="link" size={28} />
      </div>
      <h3 className="jcloud-success-title">로그인이 필요합니다.</h3>
      <p className="jcloud-success-desc">{message}</p>
      <Link className="jcloud-login-link" to="/login">
        로그인하기
      </Link>
    </div>
  )
}
