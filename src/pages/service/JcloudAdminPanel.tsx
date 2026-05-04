import { useRef, useState } from 'react'
import { Icon } from '../../shared/ui/Icon'
import { mockApplications } from '../../dummy/serviceData'
import {
  instanceTypes,
  statusMeta,
  type ApplyStatus,
  type AttachedFile,
  type JcloudApplication,
} from './serviceData'

const pendingFilters: { id: 'all' | ApplyStatus; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'pending', label: '검토 중' },
  { id: 'approved', label: '승인' },
  { id: 'rejected', label: '반려' },
]

type AppState = JcloudApplication & {
  adminNoteInput: string
  files: AttachedFile[]
}

export function JcloudAdminPanel() {
  const [filter, setFilter] = useState<'all' | ApplyStatus>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [appStates, setAppStates] = useState<Record<string, AppState>>(() =>
    Object.fromEntries(
      mockApplications.map((a) => [
        a.id,
        { ...a, adminNoteInput: a.adminNote ?? '', files: a.attachedFiles ?? [] },
      ]),
    ),
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filtered = Object.values(appStates).filter((a) =>
    filter === 'all' ? true : a.status === filter,
  )

  const selectedApp = selectedId ? appStates[selectedId] : null

  const update = (id: string, patch: Partial<AppState>) =>
    setAppStates((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))

  const handleDecision = (id: string, decision: 'approved' | 'rejected') => {
    update(id, {
      status: decision,
      approvedAt: new Date().toISOString().slice(0, 10),
      adminNote: appStates[id].adminNoteInput,
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedId || !e.target.files) return
    const newFiles: AttachedFile[] = Array.from(e.target.files).map((f) => ({
      name: f.name,
      size: f.size > 1024 * 1024 ? `${(f.size / 1024 / 1024).toFixed(1)} MB` : `${Math.round(f.size / 1024)} KB`,
      uploadedAt: new Date().toISOString().slice(0, 10),
    }))
    update(selectedId, {
      files: [...(appStates[selectedId].files ?? []), ...newFiles],
    })
    e.target.value = ''
  }

  const removeFile = (id: string, fileName: string) => {
    update(id, {
      files: appStates[id].files.filter((f) => f.name !== fileName),
    })
  }

  return (
    <div className="jcloud-admin-shell">
      <div className="jcloud-admin-list-col">
        <div className="jcloud-list-toolbar">
          <ul className="jcloud-filter-tabs">
            {pendingFilters.map((f) => (
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
          <span className="jcloud-list-count">{filtered.length}건</span>
        </div>

        <ul className="jcloud-admin-app-list">
          {filtered.map((app) => {
            const meta = statusMeta[app.status]
            const inst = instanceTypes.find((t) => t.id === app.instanceType)
            return (
              <li key={app.id}>
                <button
                  type="button"
                  className={`jcloud-admin-app-row${selectedId === app.id ? ' is-selected' : ''}`}
                  onClick={() => setSelectedId(app.id)}
                >
                  <div className="jcloud-admin-app-top">
                    <span className={`jcloud-status-badge ${meta.colorClass}`}>
                      {meta.label}
                    </span>
                    <span className="jcloud-apply-instance">{inst?.label}</span>
                  </div>
                  <p className="jcloud-admin-app-name">
                    {app.applicantName}
                    <span className="jcloud-admin-app-sid"> · {app.studentId}</span>
                  </p>
                  <p className="jcloud-admin-app-date">{app.requestedAt} 신청</p>
                </button>
              </li>
            )
          })}
          {filtered.length === 0 ? (
            <li className="jcloud-list-empty">
              <Icon name="file" size={24} />
              <p>신청이 없습니다.</p>
            </li>
          ) : null}
        </ul>
      </div>

      <div className="jcloud-admin-detail-col">
        {selectedApp ? (
          <AdminDetail
            app={selectedApp}
            onDecision={handleDecision}
            onNoteChange={(v) => update(selectedApp.id, { adminNoteInput: v })}
            onFileChange={handleFileChange}
            onRemoveFile={(name) => removeFile(selectedApp.id, name)}
            fileInputRef={fileInputRef}
          />
        ) : (
          <div className="jcloud-admin-empty">
            <Icon name="file" size={32} />
            <p>신청 건을 선택하세요.</p>
          </div>
        )}
      </div>
    </div>
  )
}

type AdminDetailProps = {
  app: AppState
  onDecision: (id: string, decision: 'approved' | 'rejected') => void
  onNoteChange: (value: string) => void
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveFile: (name: string) => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
}

function AdminDetail({
  app,
  onDecision,
  onNoteChange,
  onFileChange,
  onRemoveFile,
  fileInputRef,
}: AdminDetailProps) {
  const meta = statusMeta[app.status]
  const inst = instanceTypes.find((t) => t.id === app.instanceType)

  return (
    <div className="jcloud-admin-detail">
      <div className="jcloud-admin-detail-header">
        <div>
          <p className="jcloud-admin-detail-id">{app.id}</p>
          <div className="jcloud-admin-detail-title-row">
            <span className="jcloud-apply-instance">{inst?.label}</span>
            <span className="jcloud-apply-duration">{app.duration}</span>
            <span className={`jcloud-status-badge ${meta.colorClass}`}>{meta.label}</span>
          </div>
        </div>
      </div>

      <div className="jcloud-admin-info-grid">
        <div className="jcloud-apply-detail-row">
          <span className="jcloud-detail-label">신청자</span>
          <span className="jcloud-detail-value">
            {app.applicantName} ({app.studentId})
          </span>
        </div>
        <div className="jcloud-apply-detail-row">
          <span className="jcloud-detail-label">신청일</span>
          <span className="jcloud-detail-value">{app.requestedAt}</span>
        </div>
        <div className="jcloud-apply-detail-row">
          <span className="jcloud-detail-label">사양</span>
          <span className="jcloud-detail-value">
            {app.specs.cpu} / {app.specs.ram} / {app.specs.disk}
          </span>
        </div>
        <div className="jcloud-apply-detail-row">
          <span className="jcloud-detail-label">사용 목적</span>
          <span className="jcloud-detail-value">{app.purpose}</span>
        </div>
      </div>

      <div className="jcloud-admin-note-section">
        <label className="jcloud-label" htmlFor="admin-note">
          관리자 메모
        </label>
        <textarea
          id="admin-note"
          className="jcloud-textarea"
          placeholder="승인/반려 메모를 입력하세요."
          rows={3}
          value={app.adminNoteInput}
          onChange={(e) => onNoteChange(e.target.value)}
          disabled={app.status !== 'pending'}
        />
      </div>

      <div className="jcloud-admin-file-section">
        <p className="jcloud-label">
          <Icon name="file" size={13} />
          첨부 파일
        </p>
        {app.files.length > 0 ? (
          <ul className="jcloud-file-list">
            {app.files.map((file) => (
              <li key={file.name} className="jcloud-file-item">
                <Icon name="file" size={13} />
                <span className="jcloud-file-name">{file.name}</span>
                <span className="jcloud-file-meta">
                  {file.size} · {file.uploadedAt}
                </span>
                {app.status === 'pending' ? (
                  <button
                    type="button"
                    className="jcloud-file-remove"
                    onClick={() => onRemoveFile(file.name)}
                  >
                    삭제
                  </button>
                ) : (
                  <button type="button" className="jcloud-file-download">
                    다운로드
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="jcloud-file-empty">첨부 파일이 없습니다.</p>
        )}
        {app.status === 'pending' ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              id="admin-file-upload"
              className="jcloud-file-input"
              multiple
              onChange={onFileChange}
            />
            <label htmlFor="admin-file-upload" className="jcloud-file-upload-btn">
              <Icon name="plus" size={13} />
              파일 첨부
            </label>
          </>
        ) : null}
      </div>

      {app.status === 'pending' ? (
        <div className="jcloud-admin-actions">
          <button
            type="button"
            className="jcloud-action-btn jcloud-action-btn--reject"
            onClick={() => onDecision(app.id, 'rejected')}
          >
            반려
          </button>
          <button
            type="button"
            className="jcloud-action-btn jcloud-action-btn--approve"
            onClick={() => onDecision(app.id, 'approved')}
          >
            <Icon name="bell" size={14} />
            승인
          </button>
        </div>
      ) : (
        <div className={`jcloud-decision-result jcloud-decision-result--${app.status}`}>
          {app.status === 'approved' ? (
            <Icon name="bell" size={14} />
          ) : (
            <Icon name="file" size={14} />
          )}
          {app.status === 'approved' ? `${app.approvedAt} 승인 완료` : `${app.approvedAt} 반려`}
        </div>
      )}
    </div>
  )
}
