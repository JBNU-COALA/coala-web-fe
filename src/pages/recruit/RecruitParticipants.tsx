import { useEffect, useState } from 'react'
import { recruitsApi, type RecruitApplication } from '../../shared/api/recruits'
import { CharacterAvatar } from '../../shared/ui/CharacterAvatar'

export function RecruitParticipants({
  recruitId,
  onChange
}: {
  recruitId: string
  onChange: () => void
}) {
  const [items, setItems] = useState<RecruitApplication[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    recruitsApi
      .getApplications(recruitId)
      .then((value) => {
        if (active) setItems(value)
      })
      .catch(() => {
        if (active) setError('지원자를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [recruitId])
  const decide = async (
    item: RecruitApplication,
    status: 'accepted' | 'rejected' | 'submitted'
  ) => {
    if (busy !== null) return
    setBusy(item.id)
    setError('')
    try {
      const updated = await recruitsApi.decideApplication(
        recruitId,
        item.id,
        status
      )
      setItems((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry))
      )
      onChange()
    } catch {
      setError('변경하지 못했습니다. 모집 정원과 권한을 확인해 주세요.')
    } finally {
      setBusy(null)
    }
  }
  return (
    <section className="study-participants" aria-label="지원자 관리">
      <h3>
        지원자 <small>{items.length}명</small>
      </h3>
      {error && <p role="alert">{error}</p>}
      {loading ? (
        <p role="status">불러오는 중입니다.</p>
      ) : !items.length ? (
        <p>아직 지원자가 없습니다.</p>
      ) : (
        items.map((item) => (
          <details key={item.id}>
            <summary>
              <CharacterAvatar
                name={item.userName ?? '지원자'}
                seed={String(item.userId ?? item.id)}
                size="sm"
              />
              <span>
                {item.userName ?? '지원자'}
                <small>{item.role}</small>
              </span>
              <strong>
                {item.status === 'accepted'
                  ? '승인'
                  : item.status === 'rejected'
                    ? '미선정'
                    : '검토 중'}
              </strong>
            </summary>
            <p className="study-application-body">{item.body}</p>
            <label>
              지원 상태
              <select
                aria-label="지원 상태"
                disabled={busy !== null}
                value={item.status}
                onChange={(event) => {
                  void decide(
                    item,
                    event.target.value as 'accepted' | 'rejected' | 'submitted'
                  )
                }}
              >
                <option value="submitted">검토 중</option>
                <option value="accepted">승인</option>
                <option value="rejected">미선정</option>
              </select>
            </label>
          </details>
        ))
      )}
    </section>
  )
}
