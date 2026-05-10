import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../shared/ui/Icon'
import { durationOptions, instanceTypes, type InstanceType } from './serviceData'
import { servicesApi } from '../../shared/api/services'
import { useAuth } from '../../shared/auth/AuthContext'

type JcloudApplyFormProps = {
  onSubmit: () => void
}

export function JcloudApplyForm({ onSubmit }: JcloudApplyFormProps) {
  const { user, isLoggedIn } = useAuth()
  const [selectedType, setSelectedType] = useState<InstanceType>('micro')
  const [selectedDuration, setSelectedDuration] = useState('6m')
  const [purpose, setPurpose] = useState('')
  const [keyEmail, setKeyEmail] = useState<string | null>(null)
  const [applicantName, setApplicantName] = useState<string | null>(null)
  const [studentId, setStudentId] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedSpec = instanceTypes.find((t) => t.id === selectedType)
  const resolvedApplicantName = applicantName ?? user?.name ?? ''
  const resolvedStudentId = studentId ?? user?.studentId ?? ''
  const resolvedKeyEmail = keyEmail ?? user?.email ?? ''

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (
      !agreed ||
      !purpose.trim() ||
      !resolvedKeyEmail.trim() ||
      !resolvedApplicantName.trim() ||
      !resolvedStudentId.trim()
    ) return
    try {
      await servicesApi.createInstanceApplication({
        applicantName: resolvedApplicantName.trim(),
        studentId: resolvedStudentId.trim(),
        keyEmail: resolvedKeyEmail.trim(),
        instanceType: selectedType,
        duration: durationOptions.find((d) => d.id === selectedDuration)?.label ?? selectedDuration,
        purpose: purpose.trim(),
      })
      setSubmitted(true)
      onSubmit()
    } catch {
      setError('신청 접수에 실패했습니다. 다시 시도해주세요.')
    }
  }

  if (submitted) {
    return (
      <div className="jcloud-submit-success">
        <div className="jcloud-success-icon">
          <Icon name="bell" size={28} />
        </div>
        <h3 className="jcloud-success-title">신청이 접수되었습니다.</h3>
        <p className="jcloud-success-desc">
          승인 후 접속 키와 안내는 입력한 메일로 발송됩니다.
        </p>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="jcloud-login-required">
        <div className="jcloud-success-icon">
          <Icon name="settings" size={28} />
        </div>
        <h3 className="jcloud-success-title">로그인 후 신청할 수 있습니다.</h3>
        <p className="jcloud-success-desc">
          인스턴스 신청 정보는 로그인된 사용자 정보로 기본 설정됩니다.
        </p>
        <Link className="jcloud-login-link" to="/login">
          로그인하기
        </Link>
      </div>
    )
  }

  return (
    <form className="jcloud-apply-form" onSubmit={handleSubmit}>
      <div className="jcloud-form-section">
        <h3 className="jcloud-form-section-title">인스턴스 선택</h3>
        <div className="jcloud-instance-grid">
          {instanceTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              className={`jcloud-instance-card${selectedType === type.id ? ' is-selected' : ''}`}
              onClick={() => setSelectedType(type.id)}
            >
              <p className="jcloud-instance-label">{type.label}</p>
              <ul className="jcloud-spec-list">
                <li><Icon name="settings" size={11} />{type.specs.cpu}</li>
                <li><Icon name="layout" size={11} />{type.specs.ram}</li>
                <li><Icon name="file" size={11} />{type.specs.disk}</li>
              </ul>
            </button>
          ))}
        </div>
      </div>

      <div className="jcloud-form-section">
        <h3 className="jcloud-form-section-title">사용 기간</h3>
        <div className="jcloud-duration-row">
          {durationOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`jcloud-duration-chip${selectedDuration === opt.id ? ' is-selected' : ''}`}
              disabled={opt.disabled}
              onClick={() => {
                if (!opt.disabled) setSelectedDuration(opt.id)
              }}
            >
              <span>{opt.label}</span>
              {opt.description ? <small>{opt.description}</small> : null}
            </button>
          ))}
        </div>
      </div>

      <div className="jcloud-form-section">
        <h3 className="jcloud-form-section-title">신청 정보</h3>
        <div className="jcloud-field-group">
          <div className="jcloud-field-row">
            <div className="jcloud-field">
              <label className="jcloud-label" htmlFor="apply-name">이름</label>
              <input
                id="apply-name"
                type="text"
                className="jcloud-input"
                placeholder="홍길동"
                value={resolvedApplicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                required
              />
            </div>
            <div className="jcloud-field">
              <label className="jcloud-label" htmlFor="apply-student-id">학번</label>
              <input
                id="apply-student-id"
                type="text"
                className="jcloud-input"
                placeholder="20210000"
                pattern="\d{8}"
                value={resolvedStudentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="jcloud-field">
            <label className="jcloud-label" htmlFor="apply-key-email">
              키를 받을 메일
            </label>
            <input
              id="apply-key-email"
              type="email"
              className="jcloud-input"
              placeholder="coala.jbnu@gmail.com"
              value={resolvedKeyEmail}
              onChange={(e) => setKeyEmail(e.target.value)}
              required
            />
          </div>
          <div className="jcloud-field">
            <label className="jcloud-label" htmlFor="apply-purpose">
              사용 목적
              <span className="jcloud-label-hint">{purpose.length} / 300</span>
            </label>
            <textarea
              id="apply-purpose"
              className="jcloud-textarea"
              placeholder="사용 목적을 입력하세요."
              rows={4}
              maxLength={300}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      <div className="jcloud-form-section jcloud-form-section--summary">
        <div className="jcloud-summary-row">
          <span className="jcloud-summary-label">인스턴스</span>
          <span className="jcloud-summary-value">{selectedSpec?.label}</span>
        </div>
        <div className="jcloud-summary-row">
          <span className="jcloud-summary-label">사양</span>
          <span className="jcloud-summary-value">
            {selectedSpec?.specs.cpu} / {selectedSpec?.specs.ram} / {selectedSpec?.specs.disk}
          </span>
        </div>
        <div className="jcloud-summary-row">
          <span className="jcloud-summary-label">기간</span>
          <span className="jcloud-summary-value">
            {durationOptions.find((d) => d.id === selectedDuration)?.label}
          </span>
        </div>
        <div className="jcloud-summary-row">
          <span className="jcloud-summary-label">키 수신 메일</span>
          <span className="jcloud-summary-value">{resolvedKeyEmail || '-'}</span>
        </div>
      </div>

      <section className="jcloud-terms-box" aria-label="인스턴스 대여 약관">
        <h3>인스턴스 대여 약관</h3>
        <ul>
          <li>인스턴스는 동아리 프로젝트, 학습, 실습 목적 안에서 사용합니다.</li>
          <li>접속 키와 계정 정보는 본인만 사용하며 외부 공유를 금지합니다.</li>
          <li>보안 사고, 과도한 자원 사용, 목적 외 사용이 확인되면 회수될 수 있습니다.</li>
          <li>운영 상황에 따라 비정기적으로 점검될 수 있으며, 미리 안내 후 회수될 수 있습니다.</li>
          <li>사용 종료 또는 회수 시 데이터가 삭제될 수 있으므로 필요한 자료는 직접 백업해주시기 바랍니다.</li>
        </ul>
        <div className="jcloud-open-source-notice">
          <p>
            본 인스턴스를 활용해 배포하는 서비스는 코알라 오픈소스 프로젝트에 편입되어야 합니다.
            단, 개발이나 실습 목적으로만 사용할 경우에는 해당하지 않습니다.
          </p>
          <Link to="/services">코알라 오픈소스 프로젝트 안내</Link>
        </div>
      </section>

      <label className="jcloud-agree-row">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
        />
        <span>위 대여 약관에 동의합니다.</span>
      </label>

      <button
        type="submit"
        className="jcloud-submit-button"
        disabled={
          !agreed ||
          !purpose.trim() ||
          !resolvedKeyEmail.trim() ||
          !resolvedApplicantName.trim() ||
          !resolvedStudentId.trim()
        }
      >
        <Icon name="plus" size={15} />
        신청하기
      </button>
      {error ? <p className="auth-error">{error}</p> : null}
    </form>
  )
}
