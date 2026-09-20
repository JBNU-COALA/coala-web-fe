import type { ArchiveItem } from '../../shared/api/archive'
import { Icon } from '../../shared/ui/Icon'

function repositoryLabel(value: string) {
  try {
    const url = new URL(value)
    return url.hostname === 'github.com' ? url.pathname.replace(/^\//, '').replace(/\/$/, '') : url.hostname
  } catch { return '' }
}

export function ArchiveResourceCard({ item, sourceHref, canManage, onEdit, onDelete }: {
  item: ArchiveItem
  sourceHref: string
  canManage: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const isSkill = item.category === 'agents'
  const labels: Record<string, string> = { SKILL: '스킬', AGENT: '에이전트', SEMINAR: '세미나', PAPER: '논문', OTHER: '기타' }
  const repository = repositoryLabel(item.repositoryUrl)
  return <article className={`archive-resource${isSkill ? ' archive-resource--skill' : ''}`}>
    <header>
      <span className="archive-resource-symbol"><Icon name={isSkill ? 'file' : 'book'} size={22} /></span>
      <div><span className="archive-resource-type">{labels[item.materialType ?? ''] ?? '자료'}</span>
        <h2>{item.title}</h2>
      </div>
    </header>
    <p className="archive-resource-summary">{item.summary}</p>
    <div className="archive-resource-source">
      {repository && isSkill ? <span><Icon name="book" size={14} />{repository}</span> : <span>{item.labName || item.ownerName}</span>}
      {item.eventDate && <time dateTime={item.eventDate}>{item.eventDate}</time>}
    </div>
    {!!item.tags.length && <div className="archive-resource-tags">{item.tags.slice(0, 5).map((tag) => <span key={tag}>{tag}</span>)}{item.tags.length > 5 && <span>+{item.tags.length - 5}</span>}</div>}
    {item.content && <details className="archive-resource-content">
      <summary>내용 보기</summary><pre>{item.content}</pre>
    </details>}
    <footer>
      <div>
        {sourceHref && <a href={sourceHref} target="_blank" rel="noreferrer"><Icon name="link" size={15} />{isSkill ? '문서' : '자료 열기'}</a>}
        {repository && /^https?:\/\//i.test(item.repositoryUrl) && <a href={item.repositoryUrl} target="_blank" rel="noreferrer"><Icon name="book" size={15} />저장소</a>}
      </div>
      {canManage && <div aria-label="자료 관리">
        <button type="button" onClick={onEdit}>수정</button>
        <button type="button" className="archive-resource-delete" onClick={onDelete}>삭제</button>
      </div>}
    </footer>
  </article>
}
