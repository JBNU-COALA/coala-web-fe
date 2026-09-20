import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { StudyRecord } from '../../shared/activity'
import { deleteActivityRecord } from '../../shared/activityRepository'
import { routes } from '../../shared/routes'
import { Icon } from '../../shared/ui/Icon'

export function ActivityRecordActions({ record, search, back }: {
  record: StudyRecord
  search: string
  back: string
}) {
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const remove = async () => {
    if (deleting || !window.confirm('이 출석 기록과 인증 사진을 삭제할까요?')) return
    setDeleting(true)
    setError('')
    try {
      await deleteActivityRecord(record)
      navigate(back, { replace: true })
    } catch {
      setError('삭제하지 못했습니다. 권한 또는 최신 수정 내용을 확인해 주세요.')
      setDeleting(false)
    }
  }
  return <div className="study-record-actions">
    <div role="group" aria-label="출석 기록 관리">
      <Link className="study-action" to={routes.community.activityRecordEditor(record.id) + search}>
        <Icon name="edit" size={16} />수정
      </Link>
      <button type="button" className="study-action study-action--danger" disabled={deleting} onClick={() => void remove()}>
        {deleting ? '삭제 중...' : '삭제'}
      </button>
    </div>
    {error && <p className="study-error" role="alert">{error}</p>}
  </div>
}
