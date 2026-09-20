import { Icon } from '../../shared/ui/Icon'
import type { RecruitRoleDraft } from './recruitDraft'
import './recruitForm.css'

export function RecruitRoleFields({ roles, onChange }: {
  roles: RecruitRoleDraft[]
  onChange: (roles: RecruitRoleDraft[]) => void
}) {
  return (
    <fieldset className="recruit-role-fields recruit-write-wide">
      <legend>모집 인원</legend>
      <div className="recruit-role-head" aria-hidden="true"><span>역할</span><span>인원</span><span /></div>
      {roles.map((role, index) => (
        <div className="recruit-role-row" key={role.key}>
          <input aria-label={`모집 역할 ${index + 1}`} required maxLength={80}
            placeholder="스터디원" value={role.label}
            onChange={(event) => onChange(roles.map((item) => item.key === role.key ? { ...item, label: event.target.value } : item))} />
          <div className="recruit-role-count">
            <input aria-label={`모집 인원 ${index + 1}`} type="number" inputMode="numeric" min={1} max={200} step={1}
              required value={role.max}
              onChange={(event) => onChange(roles.map((item) => item.key === role.key ? { ...item, max: event.target.value === '' ? '' : Number(event.target.value) } : item))} />
            <span aria-hidden="true">명</span>
          </div>
          <button type="button" className="recruit-role-remove" disabled={roles.length === 1}
            aria-label={`모집 역할 ${index + 1} 삭제`} title="역할 삭제"
            onClick={() => onChange(roles.filter((item) => item.key !== role.key))}>×</button>
        </div>
      ))}
      <button type="button" className="recruit-role-add" disabled={roles.length >= 20}
        onClick={() => onChange([...roles, { key: crypto.randomUUID(), label: '', max: 1 }])}>
        <Icon name="plus" size={15} />역할 추가
      </button>
    </fieldset>
  )
}
