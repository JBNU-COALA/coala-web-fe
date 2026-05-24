import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../shared/ui/Icon'
import { servicesApi } from '../../shared/api/services'
import { useAuth } from '../../shared/auth/AuthContext'

type DomainApplyFormProps = {
  onSubmit?: () => void
}

function normalizeAddress(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

export function DomainApplyForm({ onSubmit }: DomainApplyFormProps) {
  const { user, isLoggedIn } = useAuth()
  const [applicantName, setApplicantName] = useState<string | null>(null)
  const [studentId, setStudentId] = useState<string | null>(null)
  const [contactEmail, setContactEmail] = useState<string | null>(null)
  const [serviceName, setServiceName] = useState('')
  const [desiredAddress, setDesiredAddress] = useState('')
  const [repositoryUrl, setRepositoryUrl] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [purpose, setPurpose] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [submittedDomain, setSubmittedDomain] = useState('')
  const [error, setError] = useState<string | null>(null)

  const resolvedApplicantName = applicantName ?? user?.name ?? ''
  const resolvedStudentId = studentId ?? user?.studentId ?? ''
  const resolvedContactEmail = contactEmail ?? user?.email ?? ''
  const normalizedAddress = normalizeAddress(desiredAddress)
  const domainPreview = useMemo(
    () => `coala.jbnu.ac.kr/services/${normalizedAddress || '원하는-주소이름'}`,
    [normalizedAddress],
  )
  const canSubmit = Boolean(
    agreed &&
    resolvedApplicantName.trim() &&
    resolvedStudentId.trim() &&
    resolvedContactEmail.trim() &&
    serviceName.trim() &&
    normalizedAddress.length >= 3 &&
    repositoryUrl.trim() &&
    purpose.trim(),
  )

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return
    try {
      const created = await servicesApi.createDomainApplication({
        applicantName: resolvedApplicantName.trim(),
        studentId: resolvedStudentId.trim(),
        contactEmail: resolvedContactEmail.trim(),
        serviceName: serviceName.trim(),
        desiredAddress: normalizedAddress,
        repositoryUrl: repositoryUrl.trim(),
        targetUrl: targetUrl.trim() || undefined,
        purpose: purpose.trim(),
      })
      setSubmittedDomain(created.requestedDomain)
      setError(null)
      onSubmit?.()
    } catch {
      setError('도메인 신청 접수에 실패했습니다. 주소 이름과 입력 정보를 확인해주세요.')
    }
  }

  if (submittedDomain) {
    return (
      <div className="jcloud-submit-success">
        <div className="jcloud-success-icon">
          <Icon name="link" size={28} />
        </div>
        <h3 className="jcloud-success-title">도메인 신청이 접수되었습니다.</h3>
        <p className="jcloud-success-desc">
          신청 주소: {submittedDomain}
        </p>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="jcloud-login-required">
        <div className="jcloud-success-icon">
          <Icon name="link" size={28} />
        </div>
        <h3 className="jcloud-success-title">로그인 후 신청할 수 있습니다.</h3>
        <p className="jcloud-success-desc">
          도메인 신청 정보는 로그인된 사용자 정보로 기본 설정됩니다.
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
        <h3 className="jcloud-form-section-title">신청자 정보</h3>
        <div className="jcloud-field-group">
          <div className="jcloud-field-row">
            <div className="jcloud-field">
              <label className="jcloud-label" htmlFor="domain-apply-name">이름</label>
              <input
                id="domain-apply-name"
                type="text"
                className="jcloud-input"
                placeholder="홍길동"
                value={resolvedApplicantName}
                onChange={(event) => setApplicantName(event.target.value)}
                required
              />
            </div>
            <div className="jcloud-field">
              <label className="jcloud-label" htmlFor="domain-apply-student-id">학번</label>
              <input
                id="domain-apply-student-id"
                type="text"
                className="jcloud-input"
                inputMode="numeric"
                placeholder="202012237"
                pattern="\d{9}"
                title="학번은 202012237처럼 9자리 숫자로 입력해주세요."
                value={resolvedStudentId}
                onChange={(event) => setStudentId(event.target.value)}
                required
              />
            </div>
          </div>
          <div className="jcloud-field">
            <label className="jcloud-label" htmlFor="domain-contact-email">연락 메일</label>
            <input
              id="domain-contact-email"
              type="email"
              className="jcloud-input"
              placeholder="coala.jbnu@gmail.com"
              value={resolvedContactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              required
            />
          </div>
        </div>
      </div>

      <div className="jcloud-form-section">
        <h3 className="jcloud-form-section-title">도메인 정보</h3>
        <div className="jcloud-field-group">
          <div className="jcloud-field">
            <label className="jcloud-label" htmlFor="domain-service-name">서비스명</label>
            <input
              id="domain-service-name"
              className="jcloud-input"
              placeholder="서비스 이름"
              value={serviceName}
              onChange={(event) => setServiceName(event.target.value)}
              required
            />
          </div>
          <div className="jcloud-field">
            <label className="jcloud-label" htmlFor="domain-desired-address">원하는 주소 이름</label>
            <input
              id="domain-desired-address"
              className="jcloud-input"
              placeholder="my-service"
              value={desiredAddress}
              onChange={(event) => setDesiredAddress(normalizeAddress(event.target.value))}
              minLength={3}
              maxLength={40}
              required
            />
          </div>
          <div className="jcloud-form-section jcloud-form-section--summary">
            <div className="jcloud-summary-row">
              <span className="jcloud-summary-label">신청 주소</span>
              <span className="jcloud-summary-value">{domainPreview}</span>
            </div>
          </div>
          <div className="jcloud-field">
            <label className="jcloud-label" htmlFor="domain-repository">공개 저장소</label>
            <input
              id="domain-repository"
              type="url"
              className="jcloud-input"
              placeholder="https://github.com/..."
              value={repositoryUrl}
              onChange={(event) => setRepositoryUrl(event.target.value)}
              required
            />
          </div>
          <div className="jcloud-field">
            <label className="jcloud-label" htmlFor="domain-target">연결 대상 URL</label>
            <input
              id="domain-target"
              type="url"
              className="jcloud-input"
              placeholder="https:// 배포 주소 또는 인스턴스 주소"
              value={targetUrl}
              onChange={(event) => setTargetUrl(event.target.value)}
            />
          </div>
          <div className="jcloud-field">
            <label className="jcloud-label" htmlFor="domain-purpose">
              신청 사유
              <span className="jcloud-label-hint">{purpose.length} / 500</span>
            </label>
            <textarea
              id="domain-purpose"
              className="jcloud-textarea"
              placeholder="서비스 목적과 도메인이 필요한 이유를 입력하세요."
              rows={4}
              maxLength={500}
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
              required
            />
          </div>
        </div>
      </div>

      <section className="jcloud-terms-box" aria-label="도메인 신청 안내">
        <h3>도메인 신청 안내</h3>
        <p className="jcloud-terms-domain-note">
          도메인은 coala.jbnu.ac.kr/services/{'{'}본인이 원하는 주소이름{'}'} 형식으로 신청합니다.
        </p>
        <ul>
          <li>신청 서비스는 코알라 오픈소스 프로젝트(COSS)에 편입됩니다.</li>
          <li>저장소는 공개 상태로 관리하고, 서비스 소개와 운영 기록을 확인할 수 있어야 합니다.</li>
          <li>보안 사고, 목적 외 사용, 장기 미운영이 확인되면 도메인 연결이 회수될 수 있습니다.</li>
          <li>인스턴스 대여 서비스와 함께 사용할 경우 연결 대상 URL에 배포 주소를 입력해주세요.</li>
        </ul>
      </section>

      <label className="jcloud-agree-row">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(event) => setAgreed(event.target.checked)}
        />
        <span>위 도메인 신청 안내에 동의합니다.</span>
      </label>

      <button type="submit" className="jcloud-submit-button" disabled={!canSubmit}>
        <Icon name="plus" size={15} />
        도메인 신청하기
      </button>
      {error ? <p className="auth-error">{error}</p> : null}
    </form>
  )
}
