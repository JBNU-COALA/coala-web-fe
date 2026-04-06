import { useState } from 'react'
import { Icon } from '../../shared/ui/Icon'
import { durationOptions, instanceTypes, type InstanceType } from './serviceData'

type JcloudApplyFormProps = {
  onSubmit: () => void
}

export function JcloudApplyForm({ onSubmit }: JcloudApplyFormProps) {
  const [selectedType, setSelectedType] = useState<InstanceType>('medium')
  const [selectedDuration, setSelectedDuration] = useState('1m')
  const [purpose, setPurpose] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const selectedSpec = instanceTypes.find((t) => t.id === selectedType)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreed || !purpose.trim()) return
    setSubmitted(true)
    setTimeout(() => {
      onSubmit()
    }, 1600)
  }

  if (submitted) {
    return (
      <div className="jcloud-submit-success">
        <div className="jcloud-success-icon">
          <Icon name="bell" size={28} />
        </div>
        <h3 className="jcloud-success-title">신청이 접수되었습니다</h3>
        <p className="jcloud-success-desc">
          관리자 검토 후 승인 여부를 알려드립니다. 신청 내역 탭에서 상태를 확인할 수 있어요.
        </p>
      </div>
    )
  }

  return (
    <form className="jcloud-apply-form" onSubmit={handleSubmit}>
      <div className="jcloud-form-section">
        <h3 className="jcloud-form-section-title">인스턴스 유형 선택</h3>
        <div className="jcloud-instance-grid">
          {instanceTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              className={`jcloud-instance-card${selectedType === type.id ? ' is-selected' : ''}`}
              onClick={() => setSelectedType(type.id)}
            >
              {type.badge ? (
                <span className={`jcloud-instance-badge jcloud-instance-badge--${type.id === 'gpu' ? 'gpu' : 'popular'}`}>
                  {type.badge}
                </span>
              ) : null}
              <p className="jcloud-instance-label">{type.label}</p>
              <p className="jcloud-instance-desc">{type.description}</p>
              <ul className="jcloud-spec-list">
                <li>
                  <Icon name="settings" size={11} />
                  {type.specs.cpu}
                </li>
                <li>
                  <Icon name="layout" size={11} />
                  {type.specs.ram}
                </li>
                <li>
                  <Icon name="file" size={11} />
                  {type.specs.disk}
                </li>
                {type.specs.gpu ? (
                  <li>
                    <Icon name="play" size={11} />
                    {type.specs.gpu}
                  </li>
                ) : null}
              </ul>
            </button>
          ))}
        </div>
      </div>

      <div className="jcloud-form-section">
        <h3 className="jcloud-form-section-title">대여 기간</h3>
        <div className="jcloud-duration-row">
          {durationOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`jcloud-duration-chip${selectedDuration === opt.id ? ' is-selected' : ''}`}
              onClick={() => setSelectedDuration(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="jcloud-form-section">
        <h3 className="jcloud-form-section-title">신청 정보</h3>
        <div className="jcloud-field-group">
          <div className="jcloud-field-row">
            <div className="jcloud-field">
              <label className="jcloud-label" htmlFor="apply-name">
                이름
              </label>
              <input
                id="apply-name"
                type="text"
                className="jcloud-input"
                placeholder="홍길동"
                required
              />
            </div>
            <div className="jcloud-field">
              <label className="jcloud-label" htmlFor="apply-student-id">
                학번
              </label>
              <input
                id="apply-student-id"
                type="text"
                className="jcloud-input"
                placeholder="20210000"
                pattern="\d{8}"
                required
              />
            </div>
          </div>
          <div className="jcloud-field">
            <label className="jcloud-label" htmlFor="apply-purpose">
              사용 목적
              <span className="jcloud-label-hint">
                {purpose.length} / 300
              </span>
            </label>
            <textarea
              id="apply-purpose"
              className="jcloud-textarea"
              placeholder="인스턴스를 어떤 목적으로 사용할 예정인지 구체적으로 작성해주세요. (예: 캡스톤 디자인 프로젝트 API 서버 배포, 딥러닝 모델 학습 등)"
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
          <span className="jcloud-summary-label">선택 인스턴스</span>
          <span className="jcloud-summary-value">{selectedSpec?.label}</span>
        </div>
        <div className="jcloud-summary-row">
          <span className="jcloud-summary-label">사양</span>
          <span className="jcloud-summary-value">
            {selectedSpec?.specs.cpu} · {selectedSpec?.specs.ram} · {selectedSpec?.specs.disk}
            {selectedSpec?.specs.gpu ? ` · ${selectedSpec.specs.gpu}` : ''}
          </span>
        </div>
        <div className="jcloud-summary-row">
          <span className="jcloud-summary-label">대여 기간</span>
          <span className="jcloud-summary-value">
            {durationOptions.find((d) => d.id === selectedDuration)?.label}
          </span>
        </div>
      </div>

      <label className="jcloud-agree-row">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
        />
        <span>
          인스턴스 사용 규정을 확인했으며 동의합니다. 학술 목적 외 사용 시 계정이 제한될 수
          있습니다.
        </span>
      </label>

      <button
        type="submit"
        className="jcloud-submit-button"
        disabled={!agreed || !purpose.trim()}
      >
        <Icon name="plus" size={15} />
        신청하기
      </button>
    </form>
  )
}
