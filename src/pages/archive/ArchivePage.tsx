import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { archiveApi, type ArchiveCategory, type ArchiveItem, type ArchiveItemPayload } from '../../shared/api/archive'
import { attachmentsApi, type AttachmentUploadResponse } from '../../shared/api/attachments'
import { resolveApiAssetUrl } from '../../shared/api/client'
import { useAuth } from '../../shared/auth/AuthContext'
import { isAdminUser } from '../../shared/auth/adminAccess'
import { isSameUserId } from '../../shared/auth/userIdentity'
import { csaiLabOptions, formatLabOption } from '../../shared/labs'
import { routes } from '../../shared/routes'
import { Icon } from '../../shared/ui/Icon'
import { SearchField } from '../../shared/ui/SearchField'

type ArchiveDraft = {
  category: ArchiveCategory
  title: string
  summary: string
  labName: string
  eventDate: string
  materialType: string
  content: string
  sourceUrl: string
  repositoryUrl: string
  tags: string
}

type ArchiveCalendarDay = {
  dateKey: string
  day: number
  inMonth: boolean
}

const archiveTabs: { id: ArchiveCategory; label: string; eyebrow: string; icon: Parameters<typeof Icon>[0]['name']; path: string }[] = [
  {
    id: 'labs',
    label: '연구실 자료',
    eyebrow: '세미나 자료 / 논문 업로드',
    icon: 'network',
    path: routes.archive.labs,
  },
  {
    id: 'agents',
    label: '에이전트/스킬',
    eyebrow: 'SKILL.md / 저장소 공유',
    icon: 'file',
    path: routes.archive.agents,
  },
]

const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토']

const materialLabelByType: Record<string, string> = {
  SEMINAR: '세미나',
  PAPER: '논문',
  OTHER: '기타',
  SKILL: '스킬',
  AGENT: '에이전트',
}

function resolveArchiveCategory(pathname: string): ArchiveCategory {
  if (pathname.startsWith('/archive/agents') || pathname.startsWith('/archive/skills')) return 'agents'
  return 'labs'
}

function toPayload(draft: ArchiveDraft): ArchiveItemPayload {
  return {
    category: draft.category,
    title: draft.title.trim(),
    summary: draft.summary.trim(),
    labName: draft.labName.trim() || undefined,
    eventDate: draft.eventDate || undefined,
    materialType: draft.materialType,
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
    labName: item.labName ?? '',
    eventDate: item.eventDate ?? '',
    materialType: item.materialType || (item.category === 'labs' ? 'SEMINAR' : 'SKILL'),
    content: item.content,
    sourceUrl: item.sourceUrl,
    repositoryUrl: item.repositoryUrl,
    tags: item.tags.join(', '),
  }
}

function toLocalDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function currentMonthKey() {
  return toLocalDateKey(new Date()).slice(0, 7)
}

const emptyDraft = (category: ArchiveCategory): ArchiveDraft => ({
  category,
  title: '',
  summary: '',
  labName: '',
  eventDate: category === 'labs' ? toLocalDateKey(new Date()) : '',
  materialType: category === 'labs' ? 'SEMINAR' : 'SKILL',
  content: '',
  sourceUrl: '',
  repositoryUrl: '',
  tags: '',
})

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

function toArchivePreview(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function getArchiveItemDate(item: ArchiveItem) {
  return item.eventDate || ''
}

function formatArchiveDay(dateKey: string) {
  if (!dateKey) return '날짜 없음'
  const parsed = new Date(`${dateKey}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return dateKey
  return parsed.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

function formatArchiveMonth(monthKey: string) {
  const parsed = new Date(`${monthKey}-01T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return monthKey
  return parsed.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  })
}

function shiftMonth(monthKey: string, amount: number) {
  const parsed = new Date(`${monthKey}-01T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return currentMonthKey()
  parsed.setMonth(parsed.getMonth() + amount)
  return toLocalDateKey(parsed).slice(0, 7)
}

function buildCalendarDays(monthKey: string): ArchiveCalendarDay[] {
  const firstDay = new Date(`${monthKey}-01T00:00:00`)
  if (Number.isNaN(firstDay.getTime())) return []

  const start = new Date(firstDay)
  start.setDate(1 - firstDay.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const dateKey = toLocalDateKey(date)
    return {
      dateKey,
      day: date.getDate(),
      inMonth: dateKey.startsWith(monthKey),
    }
  })
}

function getMaterialLabel(type?: string | null) {
  return materialLabelByType[(type || '').toUpperCase()] ?? '자료'
}

function stripFileExtension(fileName: string) {
  return fileName.replace(/\.[^.]+$/, '').trim() || fileName
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size}B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)}KB`
  return `${(size / 1024 / 1024).toFixed(1)}MB`
}

function buildUploadedFileContent(uploaded: AttachmentUploadResponse) {
  return [
    `업로드 파일: ${uploaded.originalName}`,
    `파일 형식: ${uploaded.contentType}`,
    `파일 크기: ${formatFileSize(uploaded.fileSize)}`,
  ].join('\n')
}

function getArchiveSourceHref(url: string) {
  return url ? resolveApiAssetUrl(url) : ''
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
  const [isUploadingArchiveFile, setIsUploadingArchiveFile] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [calendarMonth, setCalendarMonth] = useState(() => currentMonthKey())
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateKey(new Date()))

  const activeTab = archiveTabs.find((tab) => tab.id === activeCategory) ?? archiveTabs[0]
  const actionLabel = activeCategory === 'labs' ? '연구실 자료 등록' : '에이전트/스킬 등록'
  const formIsLabs = draft.category === 'labs'

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

  const closeForm = () => {
    setShowForm(false)
    setEditingItemId(null)
    const nextDraft = emptyDraft(activeCategory)
    if (activeCategory === 'labs' && user?.lab) nextDraft.labName = user.lab
    setDraft(nextDraft)
    setUploadedFileName('')
    setArchiveError(null)
  }

  const startCreate = () => {
    if (!isLoggedIn) {
      setArchiveError('자료 등록은 로그인 후 사용할 수 있습니다.')
      return
    }
    setDraft(emptyDraft(activeCategory))
    setUploadedFileName('')
    setEditingItemId(null)
    setShowForm(true)
    setArchiveError(null)
  }

  const startCreateForDate = (dateKey: string) => {
    if (!isLoggedIn) {
      setArchiveError('자료 등록은 로그인 후 사용할 수 있습니다.')
      return
    }
    setDraft({ ...emptyDraft('labs'), labName: user?.lab ?? '', eventDate: dateKey })
    setUploadedFileName('')
    setEditingItemId(null)
    setShowForm(true)
    setArchiveError(null)
  }

  const startEdit = (item: ArchiveItem) => {
    setDraft(itemToDraft(item))
    setUploadedFileName('')
    setEditingItemId(item.id)
    setShowForm(true)
    setArchiveError(null)
  }

  const canManage = (item: ArchiveItem) => {
    return isAdmin || isSameUserId(item.ownerId, user?.id)
  }

  const handleArchiveFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setIsUploadingArchiveFile(true)
    setArchiveError(null)
    try {
      const uploaded = await attachmentsApi.uploadFile(file)
      setUploadedFileName(uploaded.originalName)
      setDraft((current) => ({
        ...current,
        sourceUrl: uploaded.url,
        title: current.title.trim() || stripFileExtension(uploaded.originalName),
        summary: current.summary.trim() || '연구실 세미나 자료 / 논문',
        content: current.content.trim() || buildUploadedFileContent(uploaded),
        tags: current.tags.trim() || '세미나, 논문',
      }))
    } catch (error) {
      setArchiveError(error instanceof Error ? error.message : '파일을 업로드하지 못했습니다.')
    } finally {
      setIsUploadingArchiveFile(false)
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!isLoggedIn) {
      setArchiveError('자료 등록은 로그인 후 사용할 수 있습니다.')
      return
    }

    const payload = toPayload(draft)
    if (payload.category === 'labs' && !payload.sourceUrl) {
      setArchiveError('연구실 자료는 파일 업로드 또는 자료 링크가 필요합니다.')
      return
    }
    if (payload.category === 'labs' && (!payload.labName || !payload.eventDate)) {
      setArchiveError('연구실명과 세미나/논문 날짜를 입력해주세요.')
      return
    }

    try {
      const saved = editingItemId
        ? await archiveApi.updateItem(editingItemId, payload)
        : await archiveApi.createItem(payload)

      setItems((current) => {
        const next = current.some((item) => item.id === saved.id)
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...current]
        return next.filter((item) => item.category === activeCategory)
      })
      if (saved.category === 'labs' && saved.eventDate) {
        setSelectedDate(saved.eventDate)
        setCalendarMonth(saved.eventDate.slice(0, 7))
      }
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
        <header className="archive-header">
          <div>
            <p>Archive</p>
            <h1>자료실</h1>
          </div>
          <button type="button" className="write-post-button archive-add-button" onClick={startCreate}>
            <Icon name="plus" size={15} />
            {actionLabel}
          </button>
        </header>

        <div className="archive-workspace">
          <section className="surface-card archive-classifier" aria-label="자료실 분류">
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
                  <span className="archive-tab-icon">
                    <Icon name={tab.icon} size={17} />
                  </span>
                  <span>
                    <strong>{tab.label}</strong>
                    <small>{tab.eyebrow}</small>
                  </span>
                </button>
              ))}
            </div>

            <dl className="archive-summary">
              <div>
                <dt>표시</dt>
                <dd>{visibleItems.length}</dd>
              </div>
              <div>
                <dt>전체</dt>
                <dd>{items.length}</dd>
              </div>
            </dl>
          </section>

          <main className="archive-main">
            <section className="surface-card archive-toolbar" aria-label="자료실 검색">
              <div className="archive-toolbar-title">
                <p>{activeTab.eyebrow}</p>
                <strong>{activeTab.label} 자료</strong>
              </div>
              <SearchField
                className="archive-search"
                value={query}
                onChange={setQuery}
                placeholder={activeCategory === 'labs' ? '논문명, 세미나명, 태그 검색' : '스킬명, 저장소, 태그 검색'}
              />
              {archiveError ? <p className="auth-error archive-message">{archiveError}</p> : null}
            </section>

            {activeCategory === 'labs' ? (
              <section className="surface-card archive-calendar" aria-label="연구실 세미나 캘린더">
                <div className="archive-calendar-head">
                  <div>
                    <p>Seminar Calendar</p>
                    <strong>{formatArchiveMonth(calendarMonth)}</strong>
                    <span>{monthLabItems.length}개 자료 · {monthLabCount || 0}개 연구실</span>
                  </div>
                  <div className="archive-calendar-controls">
                    <button type="button" onClick={() => setCalendarMonth((current) => shiftMonth(current, -1))}>
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
                    <button type="button" onClick={() => setCalendarMonth((current) => shiftMonth(current, 1))}>
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
                              <button type="button" onClick={() => startEdit(item)}>{item.title}</button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </aside>
                </div>
              </section>
            ) : null}

            {showForm ? (
              <form className="surface-card archive-form" onSubmit={handleSubmit}>
                <div className="archive-form-head">
                  <div>
                    <p>{editingItemId ? '자료 수정' : '자료 등록'}</p>
                    <strong>{formIsLabs ? '세미나 자료 / 논문' : '에이전트 / 스킬'}</strong>
                  </div>
                  <button type="button" className="ghost-button" onClick={closeForm}>닫기</button>
                </div>

                {formIsLabs ? (
                  <label className={draft.sourceUrl ? 'archive-upload-zone archive-upload-zone--ready' : 'archive-upload-zone'}>
                    <input type="file" onChange={handleArchiveFileChange} disabled={isUploadingArchiveFile} />
                    <Icon name="file" size={22} />
                    <span>
                      <strong>{isUploadingArchiveFile ? '업로드 중' : draft.sourceUrl ? '파일 연결됨' : '파일 업로드'}</strong>
                      <small>{uploadedFileName || (draft.sourceUrl ? '등록된 파일 또는 링크가 있습니다.' : 'PDF, PPTX, DOCX, ZIP 자료')}</small>
                    </span>
                  </label>
                ) : null}

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
                      placeholder={formIsLabs ? '세미나, 논문, 2026' : 'SKILL.md, AGENTS.md, MCP'}
                    />
                  </label>
                  {formIsLabs ? (
                    <>
                      <label className="jcloud-field">
                        <span className="jcloud-label">연구실명</span>
                        <input
                          className="jcloud-input"
                          list="archive-lab-options"
                          value={draft.labName}
                          onChange={(event) => setDraft((current) => ({ ...current, labName: event.target.value }))}
                          required
                          maxLength={120}
                          placeholder="COALA Lab"
                        />
                        <datalist id="archive-lab-options">
                          {csaiLabOptions.map((lab) => {
                            const label = formatLabOption(lab)
                            return <option key={label} value={label} />
                          })}
                        </datalist>
                      </label>
                      <label className="jcloud-field">
                        <span className="jcloud-label">세미나/논문 날짜</span>
                        <input
                          className="jcloud-input"
                          type="date"
                          value={draft.eventDate}
                          onChange={(event) => setDraft((current) => ({ ...current, eventDate: event.target.value }))}
                          required
                        />
                      </label>
                      <label className="jcloud-field">
                        <span className="jcloud-label">자료 유형</span>
                        <select
                          className="jcloud-input"
                          value={draft.materialType}
                          onChange={(event) => setDraft((current) => ({ ...current, materialType: event.target.value }))}
                        >
                          <option value="SEMINAR">세미나</option>
                          <option value="PAPER">논문</option>
                          <option value="OTHER">기타</option>
                        </select>
                      </label>
                    </>
                  ) : (
                    <label className="jcloud-field">
                      <span className="jcloud-label">공유 유형</span>
                      <select
                        className="jcloud-input"
                        value={draft.materialType}
                        onChange={(event) => setDraft((current) => ({ ...current, materialType: event.target.value }))}
                      >
                        <option value="SKILL">스킬</option>
                        <option value="AGENT">에이전트</option>
                        <option value="OTHER">기타</option>
                      </select>
                    </label>
                  )}
                  <label className="jcloud-field archive-form-wide">
                    <span className="jcloud-label">{formIsLabs ? '자료명' : '이름'}</span>
                    <input
                      className="jcloud-input"
                      value={draft.title}
                      onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                      required
                      maxLength={150}
                    />
                  </label>
                  <label className="jcloud-field archive-form-wide">
                    <span className="jcloud-label">{formIsLabs ? '요약' : '한 줄 설명'}</span>
                    <input
                      className="jcloud-input"
                      value={draft.summary}
                      onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))}
                      required
                      maxLength={500}
                    />
                  </label>
                  <label className="jcloud-field">
                    <span className="jcloud-label">{formIsLabs ? '파일/자료 링크' : '문서 링크'}</span>
                    <input
                      className="jcloud-input"
                      type={draft.sourceUrl.startsWith('/') ? 'text' : 'url'}
                      value={draft.sourceUrl}
                      onChange={(event) => setDraft((current) => ({ ...current, sourceUrl: event.target.value }))}
                      placeholder={formIsLabs ? '파일 업로드 시 자동 입력' : 'https://...'}
                    />
                  </label>
                  <label className="jcloud-field">
                    <span className="jcloud-label">{formIsLabs ? '관련 저장소' : 'GitHub 저장소'}</span>
                    <input
                      className="jcloud-input"
                      type="url"
                      value={draft.repositoryUrl}
                      onChange={(event) => setDraft((current) => ({ ...current, repositoryUrl: event.target.value }))}
                      placeholder="https://github.com/..."
                    />
                  </label>
                  <label className="jcloud-field archive-form-wide">
                    <span className="jcloud-label">{formIsLabs ? '메모' : '사용 예시 / 구조'}</span>
                    <textarea
                      className="jcloud-textarea"
                      value={draft.content}
                      onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))}
                      required
                      rows={formIsLabs ? 5 : 8}
                      placeholder={formIsLabs ? '발표 주제, 논문 정보, 참고 사항' : 'SKILL.md 위치, 설치 방법, 사용 예시'}
                    />
                  </label>
                </div>
                <div className="archive-form-actions">
                  <button type="submit" className="primary-button" disabled={isUploadingArchiveFile}>
                    {editingItemId ? '수정 저장' : '등록'}
                  </button>
                </div>
              </form>
            ) : null}

            <section className="archive-results" aria-label={`${activeTab.label} 자료 목록`}>
              <div className="archive-results-head">
                <strong>{visibleItems.length}개 자료</strong>
                <span>{query.trim() ? `"${query.trim()}" 검색 결과` : activeTab.label}</span>
              </div>

              <div className="archive-list">
                {isLoading ? (
                  <div className="surface-card archive-empty">자료를 불러오는 중입니다.</div>
                ) : visibleItems.length === 0 ? (
                  <div className="surface-card archive-empty">등록된 자료가 없습니다.</div>
                ) : (
                  visibleItems.map((item) => {
                    const preview = toArchivePreview(item.content)
                    const sourceHref = getArchiveSourceHref(item.sourceUrl)
                    const itemDate = getArchiveItemDate(item)

                    return (
                      <article key={item.id} className="surface-card archive-card">
                        <div className="archive-card-main">
                          <div className="archive-card-head">
                            <span className={`archive-category archive-category--${item.category}`}>
                              {item.category === 'labs' ? getMaterialLabel(item.materialType) : getMaterialLabel(item.materialType)}
                            </span>
                            <small>
                              {item.category === 'labs'
                                ? `${item.labName || '연구실 미지정'} · ${itemDate ? formatArchiveDay(itemDate) : '날짜 미지정'}`
                                : formatArchiveDate(item.createdAt)}
                            </small>
                          </div>
                          <h3>{item.title}</h3>
                          <p>{item.summary}</p>
                          {preview ? <div className="archive-card-content">{preview}</div> : null}
                          <div className="archive-card-tags">
                            {item.tags.length > 0
                              ? item.tags.map((tag) => <span key={tag}>{tag}</span>)
                              : <span>태그 없음</span>}
                          </div>
                        </div>
                        <footer className="archive-card-footer">
                          <span>{item.ownerName}</span>
                          <div className="archive-card-actions">
                            {sourceHref ? (
                              <a href={sourceHref} target="_blank" rel="noreferrer">
                                <Icon name="link" size={13} />
                                {item.category === 'labs' ? '다운로드' : '문서'}
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
                    )
                  })
                )}
              </div>
            </section>
          </main>
        </div>
      </div>
    </section>
  )
}
