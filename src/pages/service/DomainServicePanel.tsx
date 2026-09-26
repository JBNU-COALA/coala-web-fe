import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../shared/ui/Icon'
import { servicesApi, type DomainApplication } from '../../shared/api/services'
import { ServiceWorkspace } from '../../shared/ui/ServiceWorkspace'
import { useAuth } from '../../shared/auth/AuthContext'
import { statusMeta, type ApplyStatus } from './serviceData'
import { DomainApplyForm } from './DomainApplyForm'


const statusFilters: { id: 'all' | ApplyStatus; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'pending', label: '검토 중' },
  { id: 'approved', label: '승인' },
  { id: 'rejected', label: '반려' },
]

export function DomainServicePanel() {
  return <div className="services-instance-panel">
    <ServiceWorkspace kind="domains" form={(onSubmit) => <DomainApplyForm onSubmit={onSubmit} />}
      list={<DomainApplyList />} />
  </div>
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
