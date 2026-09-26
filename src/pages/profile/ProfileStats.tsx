import { Icon } from '../../shared/ui/Icon'

type ProfileStatsProps = {
  points: number
  commits: number
  repositories: number
  awards: number
  posts?: number
  onAddRepository?: () => void
  onAddAward?: () => void
}

export function ProfileStats({
  points,
  commits,
  repositories,
  awards,
  posts,
  onAddRepository,
  onAddAward,
}: ProfileStatsProps) {
  const metrics = [
    { label: '활동 점수', value: points.toLocaleString() },
    { label: 'GitHub 커밋', value: commits.toLocaleString() },
    {
      label: '공유 저장소',
      value: `${repositories}개`,
      onAdd: onAddRepository,
      addLabel: '공유 저장소 추가',
    },
    {
      label: '수상 내역',
      value: `${awards}개`,
      onAdd: onAddAward,
      addLabel: '수상 내역 추가',
    },
    { label: '작성 내용', value: posts == null ? '-' : `${posts}개` },
  ]
  return (
    <dl className="profile-stats-grid" aria-label="활동 요약">
      {metrics.map((metric) => (
        <div className="profile-stat-card" key={metric.label}>
          <dt className="profile-stat-label">{metric.label}</dt>
          <dd className="profile-stat-card-head">
            <span className="profile-stat-value">{metric.value}</span>
            {metric.onAdd && (
              <button
                type="button"
                className="profile-inline-add-button"
                onClick={metric.onAdd}
                aria-label={metric.addLabel}
                title={metric.addLabel}
              >
                <Icon name="plus" size={14} />
              </button>
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}
