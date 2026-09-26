import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { archiveApi, type ArchiveItem } from '../../shared/api/archive'
import { useAuth } from '../../shared/auth/AuthContext'
import { isAdminUser } from '../../shared/auth/adminAccess'
import { isSameUserId } from '../../shared/auth/userIdentity'
import { routes } from '../../shared/routes'
import { Icon } from '../../shared/ui/Icon'
import { SearchField } from '../../shared/ui/SearchField'
import { PageFrame } from '../../shared/ui/PageFrame'
import { FilterTabs, type FilterTabOption } from '../../shared/ui/FilterTabs'
import { ListingControls } from '../../shared/ui/ListingControls'
import { Pagination } from '../../shared/ui/Pagination'
import { usePagination } from '../../shared/ui/usePagination'
import { ArchiveResourceCard } from './ArchiveResourceCard'
import './archive.css'

import {
  weekdayLabels, resolveArchiveCategory, toLocalDateKey, currentMonthKey, getArchiveItemDate,
  formatArchiveDay, formatArchiveMonth, shiftMonth, buildCalendarDays, getMaterialLabel, getArchiveSourceHref,
} from './archiveModel'

export function ArchivePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const activeCategory = resolveArchiveCategory(location.pathname)
  const { user } = useAuth()
  const isAdmin = isAdminUser(user)
  const [items, setItems] = useState<ArchiveItem[]>([])
  const [query, setQuery] = useState('')
  const [materialFilter, setMaterialFilter] = useState('all')
  const [showCalendar, setShowCalendar] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [archiveError, setArchiveError] = useState<string | null>(null)
  const [loadRevision, setLoadRevision] = useState(0)
  const [calendarMonth, setCalendarMonth] = useState(() => currentMonthKey())
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateKey(new Date()))

  const activeTab = { label: activeCategory === 'labs' ? '연구실 자료' : '에이전트/스킬' }
  const actionLabel = '자료 등록'
  const filterOptions: FilterTabOption<string>[] = activeCategory === 'labs'
    ? [{ id: 'all', label: '전체', icon: 'layout' }, { id: 'SEMINAR', label: '세미나', icon: 'calendar', tone: 'contest' }, { id: 'PAPER', label: '논문', icon: 'book', tone: 'lab' }, { id: 'OTHER', label: '기타', icon: 'file', tone: 'resource' }]
    : [{ id: 'all', label: '전체', icon: 'layout' }, { id: 'SKILL', label: '스킬', icon: 'file', tone: 'resource' }, { id: 'AGENT', label: '에이전트', icon: 'network', tone: 'lab' }]
  const selectedMaterial = filterOptions.some((option) => option.id === materialFilter) ? materialFilter : 'all'

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
        return archiveApi.getItems(activeCategory)
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
  }, [activeCategory, loadRevision])

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return items.filter((item) => (selectedMaterial === 'all' || item.materialType === selectedMaterial)).filter((item) =>
      `${item.title} ${item.summary} ${item.content} ${item.labName ?? ''} ${item.repositoryUrl} ${item.ownerName} ${item.tags.join(' ')}`
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [items, query, selectedMaterial])
  const pagination = usePagination(visibleItems, `${activeCategory}:${selectedMaterial}:${query}`)

  const calendarDays = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth])

  const labItemsByDate = useMemo(() => {
    const grouped = new Map<string, ArchiveItem[]>()
    visibleItems
      .filter((item) => item.category === 'labs')
      .forEach((item) => {
        const dateKey = getArchiveItemDate(item)
        if (!dateKey) return
        grouped.set(dateKey, [...(grouped.get(dateKey) ?? []), item])
      })
    return grouped
  }, [visibleItems])

  const monthLabItems = useMemo(
    () => visibleItems.filter((item) => item.category === 'labs' && getArchiveItemDate(item).startsWith(calendarMonth)),
    [calendarMonth, visibleItems],
  )

  const undatedLabItems = useMemo(
    () => visibleItems.filter((item) => item.category === 'labs' && !getArchiveItemDate(item)),
    [visibleItems],
  )

  const selectedDateItems = labItemsByDate.get(selectedDate) ?? []
  const monthLabCount = new Set(monthLabItems.map((item) => item.labName?.trim()).filter(Boolean)).size

  const startCreate = () => navigate(routes.archive.new(activeCategory))
  const startCreateForDate = (date: string) => navigate(routes.archive.new('labs') + '?date=' + date)
  const startEdit = (item: ArchiveItem) => navigate(routes.archive.editor(item.category, item.id))

  const canManage = (item: ArchiveItem) => {
    return isAdmin || isSameUserId(item.ownerId, user?.id)
  }

  const handleDelete = async (item: ArchiveItem) => {
    if (!canManage(item)) {
      setArchiveError('자료 삭제 권한이 없습니다.')
      return
    }

    if (!window.confirm('이 자료를 삭제할까요?')) return
    try {
      await archiveApi.deleteItem(item.id)
      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id))
    } catch {
      setArchiveError('자료 삭제에 실패했습니다.')
    }
  }

  return (
    <PageFrame title={activeTab.label} tone="archive" className="coala-content--archive" bodyClassName={`archive-content archive-content--${activeCategory}`}>
      <ListingControls label="자료 분류 및 검색" count={`자료 ${visibleItems.length}개`}
        filters={<FilterTabs value={selectedMaterial} options={filterOptions} onChange={setMaterialFilter}
          ariaLabel="자료 분류" separateFirst />}
        accessory={activeCategory === 'labs' && <button type="button" className="archive-calendar-toggle"
          aria-pressed={showCalendar} onClick={() => setShowCalendar((value) => !value)}>
          <Icon name="calendar" size={16} />캘린더
        </button>}
        message={archiveError && <div className="archive-message"><p className="auth-error" role="alert">{archiveError}</p><button className="ghost-button" type="button" onClick={() => setLoadRevision((value) => value + 1)}>다시 불러오기</button></div>}>
          <SearchField className="archive-search" value={query} onChange={setQuery}
            placeholder={activeCategory === 'labs' ? '논문, 세미나, 연구실 검색' : '스킬, 에이전트, 저장소 검색'} />
          <button type="button" className="write-post-button" onClick={startCreate}>
            <Icon name="plus" size={15} />{actionLabel}
          </button>
      </ListingControls>
            {activeCategory === 'labs' && showCalendar ? (
              <section className="surface-card archive-calendar" aria-label="연구실 세미나 캘린더">
                <div className="archive-calendar-head">
                  <div>
                    <p>Seminar Calendar</p>
                    <strong>{formatArchiveMonth(calendarMonth)}</strong>
                    <span>{monthLabItems.length}개 자료 · {monthLabCount || 0}개 연구실</span>
                  </div>
                  <div className="archive-calendar-controls">
                    <button type="button" title="이전 달" aria-label="이전 달" onClick={() => setCalendarMonth((current) => shiftMonth(current, -1))}>
                      <Icon name="chevron-left" size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const today = toLocalDateKey(new Date())
                        setSelectedDate(today)
                        setCalendarMonth(today.slice(0, 7))
                      }}
                    >
                      오늘
                    </button>
                    <button type="button" title="다음 달" aria-label="다음 달" onClick={() => setCalendarMonth((current) => shiftMonth(current, 1))}>
                      <Icon name="chevron-right" size={14} />
                    </button>
                  </div>
                </div>

                <div className="archive-calendar-body">
                  <div className="archive-calendar-grid">
                    {weekdayLabels.map((label) => (
                      <span key={label} className="archive-calendar-weekday">{label}</span>
                    ))}
                    {calendarDays.map((day) => {
                      const dayItems = labItemsByDate.get(day.dateKey) ?? []
                      const isSelected = selectedDate === day.dateKey

                      return (
                        <button
                          key={day.dateKey}
                          type="button"
                          aria-label={`${day.dateKey}, 자료 ${dayItems.length}개`}
                          aria-pressed={isSelected}
                          className={[
                            'archive-calendar-day',
                            day.inMonth ? '' : 'archive-calendar-day--muted',
                            isSelected ? 'is-selected' : '',
                            dayItems.length > 0 ? 'archive-calendar-day--has-items' : '',
                          ].filter(Boolean).join(' ')}
                          onClick={() => {
                            setSelectedDate(day.dateKey)
                            if (!day.inMonth) setCalendarMonth(day.dateKey.slice(0, 7))
                          }}
                        >
                          <span className="archive-calendar-day-number">{day.day}</span>
                          {dayItems.length > 0 ? (
                            <span className="archive-calendar-day-count">{dayItems.length}</span>
                          ) : null}
                          {dayItems.slice(0, 2).map((item) => (
                            <span key={item.id} className="archive-calendar-event">
                              {item.labName || item.title}
                            </span>
                          ))}
                          {dayItems.length > 2 ? (
                            <span className="archive-calendar-event archive-calendar-event--more">+{dayItems.length - 2}</span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>

                  <aside className="archive-calendar-detail" aria-label="선택 날짜 자료">
                    <div className="archive-calendar-detail-head">
                      <div>
                        <p>선택 날짜</p>
                        <strong>{formatArchiveDay(selectedDate)}</strong>
                      </div>
                      <button type="button" className="ghost-button" onClick={() => startCreateForDate(selectedDate)}>
                        <Icon name="plus" size={14} />
                        자료 등록
                      </button>
                    </div>
                    {selectedDateItems.length > 0 ? (
                      <ul className="archive-calendar-event-list">
                        {selectedDateItems.map((item) => {
                          const sourceHref = getArchiveSourceHref(item.sourceUrl)

                          return (
                            <li key={item.id}>
                              <span>{item.labName || '연구실'}</span>
                              <strong>{item.title}</strong>
                              <small>{getMaterialLabel(item.materialType)} · {item.summary}</small>
                              {sourceHref ? (
                                <a href={sourceHref} target="_blank" rel="noreferrer">
                                  <Icon name="link" size={13} />
                                  자료 열기
                                </a>
                              ) : null}
                            </li>
                          )
                        })}
                      </ul>
                    ) : (
                      <p className="archive-calendar-empty">이 날짜에는 등록된 연구실 자료가 없습니다.</p>
                    )}
                    {undatedLabItems.length > 0 ? (
                      <div className="archive-calendar-undated">
                        <strong>날짜 미지정 자료</strong>
                        <ul>
                          {undatedLabItems.slice(0, 4).map((item) => (
                            <li key={item.id}>
                              <span>{item.labName || '연구실 미지정'}</span>
                              <button type="button" onClick={() => navigate(routes.archive.detail(item.category, item.id))}>{item.title}</button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </aside>
                </div>
              </section>
            ) : null}

            <section className="archive-results" aria-label={`${activeTab.label} 목록`}>
              <div className="archive-resource-grid">
                {isLoading ? <p className="archive-empty" role="status">자료를 불러오는 중입니다.</p>
                  : visibleItems.length === 0 && !archiveError ? <p className="archive-empty">등록된 자료가 없습니다.</p>
                  : pagination.pageItems.map((item) => <ArchiveResourceCard key={item.id} item={item}
                    sourceHref={getArchiveSourceHref(item.sourceUrl)} canManage={canManage(item)}
                    onEdit={() => startEdit(item)} onDelete={() => void handleDelete(item)} />)}
              </div>
              <Pagination page={pagination.page} pageCount={pagination.pageCount} onChange={pagination.setPage} />
            </section>
    </PageFrame>
  )
}
