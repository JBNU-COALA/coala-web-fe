import { useState } from 'react'
import { Icon } from '../../shared/ui/Icon'
import { mockApplications } from '../../dummy/serviceData'
import {
  instanceTypes,
  statusMeta,
  type ApplyStatus,
  type JcloudApplication,
} from './serviceData'

const statusFilters: { id: 'all' | ApplyStatus; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'pending', label: '검토 중' },
  { id: 'approved', label: '승인' },
  { id: 'rejected', label: '반려' },
]

export function JcloudApplyList() {
  const [filter, setFilter] = useState<'all' | ApplyStatus>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const items = filter === 'all'
    ? mockApplications
    : mockApplications.filter((a) => a.status === filter)

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id)

  return (
    <div className="jcloud-list-shell">
      <div className="jcloud-list-toolbar">
        <ul className="jcloud-filter-tabs">
          {statusFilters.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                className={`jcloud-filter-tab${filter === f.id ? ' is-active' : ''}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            </li>
          ))}
        </ul>
        <span className="jcloud-list-count">{items.length}건</span>
      </div>

      {items.length === 0 ? (
        <div className="jcloud-list-empty">
          <Icon name="file" size={28} />
          <p>신청 내역이 없습니다.</p>
        </div>
      ) : (
        <ul className="jcloud-apply-list">
          {items.map((app) => (
            <ApplicationItem
              key={app.id}
              app={app}
              isExpanded={expandedId === app.id}
              onToggle={() => toggle(app.id)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function ApplicationItem({
  app,
  isExpanded,
  onToggle,
}: {
  app: JcloudApplication
  isExpanded: boolean
  onToggle: () => void
}) {
  const meta = statusMeta[app.status]
  const instanceInfo = instanceTypes.find((t) => t.id === app.instanceType)

  return (
    <li className={`jcloud-apply-item surface-card${isExpanded ? ' is-expanded' : ''}`}>
      <button type="button" className="jcloud-apply-item-header" onClick={onToggle}>
        <div className="jcloud-apply-item-main">
          <span className={`jcloud-status-badge ${meta.colorClass}`}>{meta.label}</span>
          <span className="jcloud-apply-instance">{instanceInfo?.label ?? app.instanceType}</span>
          <span className="jcloud-apply-duration">{app.duration}</span>
        </div>
        <div className="jcloud-apply-item-meta">
          <span className="jcloud-apply-date">{app.requestedAt} 신청</span>
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
              <span className="jcloud-detail-label">사용 목적</span>
              <span className="jcloud-detail-value">{app.purpose}</span>
            </div>
            <div className="jcloud-apply-detail-row">
              <span className="jcloud-detail-label">사양</span>
              <span className="jcloud-detail-value">
                {app.specs.cpu} / {app.specs.ram} / {app.specs.disk}
              </span>
            </div>
            {app.approvedAt ? (
              <div className="jcloud-apply-detail-row">
                <span className="jcloud-detail-label">처리일</span>
                <span className="jcloud-detail-value">{app.approvedAt}</span>
              </div>
            ) : null}
          </div>

          {app.adminNote ? (
            <div className={`jcloud-admin-note jcloud-admin-note--${app.status}`}>
              <Icon name="message" size={13} />
              <p>{app.adminNote}</p>
            </div>
          ) : null}

          <div className="jcloud-mail-notice">
            <Icon name="message" size={14} />
            <div>
              <strong>메일을 확인해주세요.</strong>
              <p>
                {app.status === 'approved'
                  ? `${app.keyEmail ?? '신청한 메일'}로 접속 키와 안내가 발송됩니다.`
                  : '승인 후 접속 키와 안내가 신청한 메일로 발송됩니다.'}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </li>
  )
}
