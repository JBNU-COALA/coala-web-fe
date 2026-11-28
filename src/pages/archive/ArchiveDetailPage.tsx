import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import MDEditor from '@uiw/react-md-editor/nohighlight'
import '@uiw/react-markdown-preview/markdown.css'
import { archiveApi, type ArchiveItem } from '../../shared/api/archive'
import { useAuth } from '../../shared/auth/AuthContext'
import { isAdminUser } from '../../shared/auth/adminAccess'
import { isSameUserId } from '../../shared/auth/userIdentity'
import { prepareMarkdownForDisplay } from '../../shared/markdown'
import { PageFrame } from '../../shared/ui/PageFrame'
import { Icon } from '../../shared/ui/Icon'
import { routes } from '../../shared/routes'
import { getArchiveSourceHref, getMaterialLabel, isArchiveFileSource, resolveArchiveCategory } from './archiveModel'
import './archive.css'
import { LoadingSpinner } from '../../shared/ui/LoadingSpinner'
import { ArchiveSourceLink } from './ArchiveSourceLink'

export function ArchiveDetailPage() {
  const { itemId } = useParams()
  const { pathname } = useLocation()
  const category = resolveArchiveCategory(pathname)
  const navigate = useNavigate()
  const { user } = useAuth()
  const [item, setItem] = useState<ArchiveItem | null>(null)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  useEffect(() => {
    let active = true
    archiveApi.getItem(Number(itemId)).then((next) => {
      if (!active) return
      if (next.category !== category) { setError('자료를 찾을 수 없습니다.'); return }
      setItem(next)
    }).catch(() => { if (active) setError('자료를 불러오지 못했습니다.') })
    return () => { active = false }
  }, [itemId, category])
  const canManage = !!item && (isAdminUser(user) || isSameUserId(item.ownerId, user?.id))
  const remove = async () => {
    if (!item || !canManage || deleting || !window.confirm('이 자료를 삭제할까요?')) return
    setDeleting(true)
    try { await archiveApi.deleteItem(item.id); navigate(routes.archive[category], { replace: true }) }
    catch { setError('자료를 삭제하지 못했습니다.'); setDeleting(false) }
  }
  return <PageFrame title={category === 'labs' ? '연구실 자료' : '에이전트/스킬'} tone="archive" bodyClassName="archive-content">
    <Link className="archive-back-link" to={routes.archive[category]}><Icon name="chevron-left" size={16} />목록으로 돌아가기</Link>
    {error && <p role="alert" className="auth-error">{error}</p>}
    {!item && !error && <LoadingSpinner label="자료를 불러오는 중입니다." />}
    {item && <article className="archive-document archive-document--with-tools">
      <header className="archive-document-header">
        <span className="archive-document-type">{getMaterialLabel(item.materialType)}</span>
        <h2>{item.title}</h2><p>{item.summary}</p>
        <div className="archive-document-meta"><span>{item.ownerName}</span>
          {item.labName && <span>{item.labName}</span>}<time>{item.publicationYear ? `${item.publicationYear}년` : item.eventDate || item.createdAt?.slice(0, 10)}</time></div>
        <div className="archive-resource-tags">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      </header>
      <aside className="archive-document-tools" aria-label="원문 도구">
        {getArchiveSourceHref(item.sourceUrl) && <>
          <ArchiveSourceLink href={getArchiveSourceHref(item.sourceUrl)} isPdf={false} />
          {isArchiveFileSource(item.sourceUrl) && <ArchiveSourceLink href={getArchiveSourceHref(item.sourceUrl)} isPdf />}
        </>}
        {/^https?:\/\//i.test(item.repositoryUrl) && <a className="archive-source-link" href={item.repositoryUrl} target="_blank" rel="noreferrer" aria-label="저장소">
          <Icon name="link" size={22} /><span className="archive-source-tooltip" aria-hidden="true">저장소</span>
        </a>}
      </aside>
      <div className="archive-document-body" data-color-mode="light">
        <MDEditor.Markdown source={prepareMarkdownForDisplay(item.content)} skipHtml />
      </div>
      {canManage && <footer className="archive-document-actions" aria-label="자료 관리">
        <button disabled={deleting} type="button" onClick={() => void remove()}>{deleting ? '삭제 중' : '삭제하기'}</button>
        <Link to={routes.archive.editor(category, item.id)}>편집하기</Link>
      </footer>}
    </article>}
  </PageFrame>
}
