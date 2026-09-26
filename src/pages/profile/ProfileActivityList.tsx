import { Link } from 'react-router-dom'
import { Icon } from '../../shared/ui/Icon'
import { profileActivityHref, type ProfileActivityItem } from './profileOverview'

const applicationStatuses: Record<string, string> = {
  submitted: '검토 중', accepted: '승인', rejected: '미선정',
  pending: '대기', approved: '승인', active: '진행 중', closed: '마감',
}

export function ProfileActivityList({ items, loading, error, retry, emptyText = '등록된 활동이 없습니다.' }: {
  items: ProfileActivityItem[]
  loading: boolean
  error?: string
  retry: () => void
  emptyText?: string
}) {
  if (loading) return <p className="profile-empty-text" role="status">활동을 불러오는 중입니다.</p>
  if (error) return <div className="profile-overview-error"><p role="alert">{error}</p>
    <button type="button" className="ghost-button" onClick={retry}>다시 불러오기</button></div>
  if (!items.length) return <p className="profile-empty-text">{emptyText}</p>
  return <ul className="profile-content-list">
    {items.map((item) => {
      const href = profileActivityHref(item)
      const status = item.status && ['recruit-application', 'instance', 'domain'].includes(item.kind)
        ? applicationStatuses[item.status.toLowerCase()] ?? item.status : null
      return <li key={item.id}>
        <div className="profile-content-meta"><span className={`profile-content-label profile-content-label--${item.kind}`}>{item.label}</span>
          {status && <span>{status}</span>}
          <time dateTime={item.createdAt}>{item.createdAt.slice(0, 10)}</time>
        </div>
        {href ? <Link className="profile-content-title" to={href}>{item.title}<Icon name="chevron-right" size={16} /></Link>
          : <strong className="profile-content-title">{item.title}</strong>}
        {item.excerpt && <p>{item.excerpt}</p>}
      </li>
    })}
  </ul>
}
