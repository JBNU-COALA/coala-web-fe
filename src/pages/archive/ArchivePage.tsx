import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { archiveApi, type ArchiveCategory, type ArchiveItem, type ArchiveItemPayload } from '../../shared/api/archive'
import { useAuth } from '../../shared/auth/AuthContext'
import { isAdminUser } from '../../shared/auth/adminAccess'
import { routes } from '../../shared/routes'
import { Icon } from '../../shared/ui/Icon'
import { SearchField } from '../../shared/ui/SearchField'
import { CommunityBanner } from '../community/CommunityBanner'

type ArchiveDraft = {
  category: ArchiveCategory
  title: string
  summary: string
  content: string
  sourceUrl: string
  repositoryUrl: string
  tags: string
}

const archiveTabs: { id: ArchiveCategory; label: string; eyebrow: string; icon: Parameters<typeof Icon>[0]['name']; path: string }[] = [
  {
    id: 'labs',
    label: '연구실',
    eyebrow: 'Lab Archive',
    icon: 'network',
    path: routes.archive.labs,
  },
  {
    id: 'agents',
    label: '에이전트/스킬',
    eyebrow: 'Agents & Skills',
    icon: 'file',
    path: routes.archive.agents,
  },
]

const emptyDraft = (category: ArchiveCategory): ArchiveDraft => ({
  category,
  title: '',
  summary: '',
  content: '',
  sourceUrl: '',
  repositoryUrl: '',
  tags: '',
})

function resolveArchiveCategory(pathname: string): ArchiveCategory {
  if (pathname.startsWith('/archive/agents') || pathname.startsWith('/archive/skills')) return 'agents'
  return 'labs'
}

function toPayload(draft: ArchiveDraft): ArchiveItemPayload {
  return {
    category: draft.category,
    title: draft.title.trim(),
    summary: draft.summary.trim(),
    content: draft.content.trim(),
    sourceUrl: draft.sourceUrl.trim(),
    repositoryUrl: draft.repositoryUrl.trim(),
    tags: draft.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
  }
}

function itemToDraft(item: ArchiveItem): ArchiveDraft {
  return {
    category: item.category,
    title: item.title,
    summary: item.summary,
    content: item.content,
    sourceUrl: item.sourceUrl,
    repositoryUrl: item.repositoryUrl,
    tags: item.tags.join(', '),
  }
}

function formatArchiveDate(value?: string | null) {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ArchivePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const activeCategory = resolveArchiveCategory(location.pathname)
  const { isLoggedIn, user } = useAuth()
  const isAdmin = isAdminUser(user)
  const [items, setItems] = useState<ArchiveItem[]>([])
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [archiveError, setArchiveError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingItemId, setEditingItemId] = useState<number | null>(null)
  const [draft, setDraft] = useState<ArchiveDraft>(() => emptyDraft(activeCategory))

  const activeTab = archiveTabs.find((tab) => tab.id === activeCategory) ?? archiveTabs[0]

  useEffect(() => {
    if (location.pathname === '/archive/skills') {
      navigate(routes.archive.agents, { replace: true })
    }
  }, [location.pathname, navigate])

  useEffect(() => {
    let active = true

    Promise.resolve()
      .then(() => {
        if (active) setIsLoading(true)
        return archiveApi.getItems(activeCategory, query)
      })
      .then((nextItems) => {
        if (!active) return
        setItems(nextItems)
        setArchiveError(null)
      })
      .catch(() => {
        if (!active) return
        setItems([])
        setArchiveError('자료실 목록을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [activeCategory, query])

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return items

    return items.filter((item) =>
      `${item.title} ${item.summary} ${item.content} ${item.ownerName} ${item.tags.join(' ')}`
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [items, query])

  const closeForm = () => {
    setShowForm(false)
    setEditingItemId(null)
    setDraft(emptyDraft(activeCategory))
    setArchiveError(null)
  }

  const startCreate = () => {
    if (!isLoggedIn) {
      setArchiveError('자료 등록은 로그인 후 사용할 수 있습니다.')
      return
    }
    setDraft(emptyDraft(activeCategory))
    setEditingItemId(null)
    setShowForm(true)
    setArchiveError(null)
  }

  const startEdit = (item: ArchiveItem) => {
    setDraft(itemToDraft(item))
    setEditingItemId(item.id)
    setShowForm(true)
    setArchiveError(null)
  }

  const canManage = (item: ArchiveItem) => {
    return isAdmin || (user?.id != null && item.ownerId === user.id)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!isLoggedIn) {
      setArchiveError('자료 등록은 로그인 후 사용할 수 있습니다.')
      return
    }

    try {
      const payload = toPayload(draft)
      const saved = editingItemId
        ? await archiveApi.updateItem(editingItemId, payload)
        : await archiveApi.createItem(payload)

      setItems((current) => {
        const next = current.some((item) => item.id === saved.id)
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...current]
        return next.filter((item) => item.category === activeCategory)
      })
      closeForm()
    } catch {
      setArchiveError(editingItemId ? '자료 수정 권한이 없거나 저장에 실패했습니다.' : '자료를 등록하지 못했습니다.')
    }
  }

  const handleDelete = async (item: ArchiveItem) => {
    if (!canManage(item)) {
      setArchiveError('자료 삭제 권한이 없습니다.')
      return
    }

    try {
      await archiveApi.deleteItem(item.id)
      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id))
      if (editingItemId === item.id) closeForm()
    } catch {
      setArchiveError('자료 삭제에 실패했습니다.')
    }
  }

  return (
    <section className="coala-content coala-content--archive">
      <div className="archive-page">
        <CommunityBanner title="자료실" tone="info" />

        <section className="surface-card archive-controls" aria-label="자료실 분류 및 검색">
          <div className="archive-control-head">
            <div>
              <p>{activeTab.eyebrow}</p>
              <strong>{activeTab.label} 자료 {visibleItems.length}개</strong>
            </div>
            <button type="button" className="write-post-button archive-add-button" onClick={startCreate}>
              <Icon name="plus" size={15} />
              자료 등록
            </button>
          </div>

          <div className="archive-tab-row" role="tablist" aria-label="자료실 하위 분류">
            {archiveTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeCategory === tab.id}
                className={activeCategory === tab.id ? 'archive-tab is-active' : 'archive-tab'}
                onClick={() => {
                  if (showForm && editingItemId === null) {
                    setDraft((current) => ({ ...current, category: tab.id }))
                  }
                  navigate(tab.path)
                }}
              >
                <Icon name={tab.icon} size={15} />
                {tab.label}
              </button>
            ))}
          </div>

          <SearchField
            className="archive-search"
            value={query}
            onChange={setQuery}
            placeholder="자료 제목, 태그, 작성자 검색"
          />
          {archiveError ? <p className="auth-error archive-message">{archiveError}</p> : null}
        </section>

        {showForm ? (
          <form className="surface-card archive-form" onSubmit={handleSubmit}>
            <div className="archive-form-head">
              <div>
                <p>{editingItemId ? '자료 수정' : '자료 등록'}</p>
                <strong>{draft.category === 'labs' ? '연구실 자료' : '에이전트/스킬 자료'}</strong>
              </div>
              <button type="button" className="ghost-button" onClick={closeForm}>닫기</button>
            </div>
            <div className="archive-form-grid">
              <label className="jcloud-field">
                <span className="jcloud-label">분류</span>
                <select
                  className="jcloud-input"
                  value={draft.category}
                  onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value as ArchiveCategory }))}
                >
                  <option value="labs">연구실</option>
                  <option value="agents">에이전트/스킬</option>
                </select>
              </label>
              <label className="jcloud-field">
                <span className="jcloud-label">태그</span>
                <input
                  className="jcloud-input"
                  value={draft.tags}
                  onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value }))}
                  placeholder="세미나, 논문, AGENTS.MD"
                />
              </label>
              <label className="jcloud-field archive-form-wide">
                <span className="jcloud-label">제목</span>
                <input
                  className="jcloud-input"
                  value={draft.title}
                  onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                  required
                  maxLength={150}
                />
              </label>
              <label className="jcloud-field archive-form-wide">
                <span className="jcloud-label">요약</span>
                <input
                  className="jcloud-input"
                  value={draft.summary}
                  onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))}
                  required
                  maxLength={500}
                />
              </label>
              <label className="jcloud-field">
                <span className="jcloud-label">자료 링크</span>
                <input
                  className="jcloud-input"
                  type="url"
                  value={draft.sourceUrl}
                  onChange={(event) => setDraft((current) => ({ ...current, sourceUrl: event.target.value }))}
                  placeholder="https://..."
                />
              </label>
              <label className="jcloud-field">
                <span className="jcloud-label">저장소 링크</span>
                <input
                  className="jcloud-input"
                  type="url"
                  value={draft.repositoryUrl}
                  onChange={(event) => setDraft((current) => ({ ...current, repositoryUrl: event.target.value }))}
                  placeholder="https://github.com/..."
                />
              </label>
              <label className="jcloud-field archive-form-wide">
                <span className="jcloud-label">내용</span>
                <textarea
                  className="jcloud-textarea"
                  value={draft.content}
                  onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))}
                  required
                  rows={8}
                />
              </label>
            </div>
            <div className="archive-form-actions">
              <button type="submit" className="primary-button">
                {editingItemId ? '수정 저장' : '등록'}
              </button>
            </div>
          </form>
        ) : null}

        <section className="archive-grid" aria-label={`${activeTab.label} 자료 목록`}>
          {isLoading ? (
            <div className="surface-card archive-empty">자료를 불러오는 중입니다.</div>
          ) : visibleItems.length === 0 ? (
            <div className="surface-card archive-empty">등록된 자료가 없습니다.</div>
          ) : (
            visibleItems.map((item) => (
              <article key={item.id} className="surface-card archive-card">
                <div className="archive-card-head">
                  <span className={`archive-category archive-category--${item.category}`}>
                    {item.category === 'labs' ? '연구실' : '에이전트/스킬'}
                  </span>
                  <small>{formatArchiveDate(item.createdAt)}</small>
                </div>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <div className="archive-card-tags">
                  {item.tags.length > 0
                    ? item.tags.map((tag) => <span key={tag}>{tag}</span>)
                    : <span>태그 없음</span>}
                </div>
                <div className="archive-card-content">{item.content}</div>
                <footer className="archive-card-footer">
                  <span>{item.ownerName}</span>
                  <div className="archive-card-actions">
                    {item.sourceUrl ? (
                      <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                        <Icon name="link" size={13} />
                        자료
                      </a>
                    ) : null}
                    {item.repositoryUrl ? (
                      <a href={item.repositoryUrl} target="_blank" rel="noreferrer">
                        <Icon name="book" size={13} />
                        저장소
                      </a>
                    ) : null}
                    {canManage(item) ? (
                      <>
                        <button type="button" onClick={() => startEdit(item)}>
                          <Icon name="edit" size={13} />
                          수정
                        </button>
                        <button type="button" onClick={() => handleDelete(item)}>
                          삭제
                        </button>
                      </>
                    ) : null}
                  </div>
                </footer>
              </article>
            ))
          )}
        </section>
      </div>
    </section>
  )
}
