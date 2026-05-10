import { useEffect, useMemo, useState } from 'react'
import { infoApi, type InfoArticle, type InfoFilterId } from '../../shared/api/info'
import { Icon } from '../../shared/ui/Icon'
import { SearchField } from '../../shared/ui/SearchField'
import { CommunityBanner } from '../community/CommunityBanner'
import { getFallbackInfoBoardId } from '../../shared/communityBoards'

type InfoSharePageProps = {
  onWriteInfo?: () => void
  onOpenInfo?: (boardId: number, postId: number) => void
}

type InfoTabId = 'all' | InfoFilterId

const infoTabFilters: { id: InfoTabId; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'news', label: '소식' },
  { id: 'contest', label: '대회' },
  { id: 'lab', label: '연구실' },
  { id: 'resource', label: '자료' },
]

const infoCategoryTabs = infoTabFilters.filter(
  (filter): filter is { id: InfoFilterId; label: string } => filter.id !== 'all',
)

const filterIconById: Record<InfoTabId, Parameters<typeof Icon>[0]['name']> = {
  all: 'layout',
  news: 'bell',
  contest: 'calendar',
  lab: 'network',
  resource: 'file',
}

const markdownToSummary = (markdown: string) => (
  markdown
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[[^\]]+]\([^)]*\)/g, (match) => match.replace(/^\[|\]\([^)]*\)$/g, ''))
    .replace(/[#>*_`~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
)

export function InfoSharePage({ onWriteInfo, onOpenInfo }: InfoSharePageProps) {
  const [activeFilter, setActiveFilter] = useState<InfoTabId>('all')
  const [query, setQuery] = useState('')
  const [resources, setResources] = useState<InfoArticle[]>([])
  const [savedResourceIds, setSavedResourceIds] = useState<Set<number>>(() => new Set())
  const [copiedResourceId, setCopiedResourceId] = useState<number | null>(null)

  const normalizedQuery = query.trim().toLowerCase()
  const activeFilterLabel =
    infoTabFilters.find((filter) => filter.id === activeFilter)?.label ?? '전체'

  useEffect(() => {
    infoApi.getArticles(activeFilter, query)
      .then(setResources)
      .catch(() => setResources([]))
  }, [activeFilter, query])

  const visibleResources = useMemo(() => {
    const filteredByType =
      activeFilter === 'all'
        ? resources
        : resources.filter((card) => card.filter === activeFilter)

    if (!normalizedQuery) {
      return filteredByType
    }

    return filteredByType.filter((card) => {
      const searchable = `${card.title} ${card.meta} ${card.source} ${card.tag}`.toLowerCase()
      return searchable.includes(normalizedQuery)
    })
  }, [activeFilter, normalizedQuery, resources])

  const toggleSavedResource = (resourceId: number) => {
    setSavedResourceIds((current) => {
      const next = new Set(current)
      if (next.has(resourceId)) next.delete(resourceId)
      else next.add(resourceId)
      return next
    })
  }

  const copyResourceTitle = async (resourceId: number, title: string) => {
    try {
      await navigator.clipboard.writeText(title)
      setCopiedResourceId(resourceId)
      setTimeout(() => setCopiedResourceId(null), 1600)
    } catch {
      setCopiedResourceId(null)
    }
  }

  return (
    <section className="coala-content coala-content--info">
      <article className="info-shell">
        <CommunityBanner
          title="정보공유"
          tone="info"
        />

        <section className="surface-card community-list-controls info-list-controls" aria-label="정보공유 필터">
          <div className="community-list-summary">
            <div className="community-list-heading">
              <p>{activeFilterLabel}</p>
              <strong>게시글 {visibleResources.length}개</strong>
            </div>
          </div>

          <div className="community-filter-tabs community-filter-tabs--with-all" role="tablist" aria-label="정보공유 분류">
            <button
              type="button"
              role="tab"
              aria-selected={activeFilter === 'all'}
              className={
                activeFilter === 'all'
                  ? 'community-filter-tab community-filter-tab--all is-active'
                  : 'community-filter-tab community-filter-tab--all'
              }
              onClick={() => setActiveFilter('all')}
            >
              <Icon name={filterIconById.all} size={15} />
              전체
            </button>
            <span className="community-filter-divider" aria-hidden="true" />
            <div className="community-filter-grouped">
              {infoCategoryTabs.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  role="tab"
                  aria-selected={activeFilter === filter.id}
                  className={
                    activeFilter === filter.id
                      ? `community-filter-tab info-filter-tab info-filter-tab--${filter.id} is-active`
                      : `community-filter-tab info-filter-tab info-filter-tab--${filter.id}`
                  }
                  onClick={() => setActiveFilter(filter.id)}
                >
                  <Icon name={filterIconById[filter.id]} size={15} />
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="community-list-actions">
            <SearchField
              className="community-list-search"
              value={query}
              onChange={setQuery}
              placeholder="소식, 대회, 연구실, 자료 검색"
            />
            <button
              type="button"
              className="write-post-button write-post-button--info"
              onClick={onWriteInfo}
            >
              <Icon name="edit" size={15} />
              글쓰기
            </button>
          </div>
        </section>

        <article className="surface-card board-shell info-board-shell" aria-label="정보공유 목록">
          <ul className="board-post-list info-list info-list--editorial">
            {visibleResources.map((card) => {
              const [sourceName, sourceDate] = card.source.split('|').map((part) => part.trim())
              const summary = markdownToSummary(card.content)

              return (
                <li key={card.id} className="board-post-row info-post-row">
                  <div className="board-post-card info-post-card">
                    <button
                      type="button"
                      className="info-post-open"
                      onClick={() => onOpenInfo?.(getFallbackInfoBoardId(card.filter), card.id)}
                    >
                      <div className="board-post-main">
                        <div className="board-post-heading">
                          <span className={`board-tag info-tag info-tag--${card.filter}`}>
                            {card.tag}
                          </span>
                          <h3 className="board-post-title">{card.title}</h3>
                        </div>

                        <p className="board-post-excerpt">
                          {summary.slice(0, 120)}
                        </p>

                        <p className="board-post-meta">
                          <span className="board-avatar board-avatar--mint">
                            {(sourceName || '코')[0]}
                          </span>
                          <span>{sourceName || '코알라'}</span>
                          {sourceDate ? (
                            <>
                              <span className="dot-divider" />
                              <span>{sourceDate}</span>
                            </>
                          ) : null}
                        </p>
                      </div>
                    </button>

                    <div className="board-post-stats info-post-stats">
                      <span className="board-stat">
                        <Icon name="file" size={14} />
                        <span>{card.meta}</span>
                      </span>
                      <div className="info-list-actions">
                        <button
                          type="button"
                          className={
                            savedResourceIds.has(card.id)
                              ? 'info-list-action info-list-action--active'
                              : 'info-list-action'
                          }
                          aria-label="정보 저장"
                          aria-pressed={savedResourceIds.has(card.id)}
                          onClick={() => {
                            toggleSavedResource(card.id)
                            infoApi.bookmarkArticle(card.id).catch(() => {})
                          }}
                        >
                          <Icon name="book" size={14} />
                        </button>
                        <button
                          type="button"
                          className="info-list-action"
                          aria-label="정보 제목 복사"
                          onClick={() => copyResourceTitle(card.id, card.title)}
                        >
                          <Icon name={copiedResourceId === card.id ? 'copy' : 'link'} size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}

            {visibleResources.length === 0 ? (
              <li className="empty-post-state">조건에 맞는 정보가 없습니다.</li>
            ) : null}
          </ul>

          <footer className="board-pagination" aria-label="페이지">
            <button type="button" className="page-button is-active">
              1
            </button>
          </footer>
        </article>
      </article>
    </section>
  )
}
