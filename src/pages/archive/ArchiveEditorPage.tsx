import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { archiveApi } from '../../shared/api/archive'
import { attachmentsApi } from '../../shared/api/attachments'
import { useAuth } from '../../shared/auth/AuthContext'
import { isAdminUser } from '../../shared/auth/adminAccess'
import { isSameUserId } from '../../shared/auth/userIdentity'
import { routes } from '../../shared/routes'
import { PageFrame } from '../../shared/ui/PageFrame'
import { Icon } from '../../shared/ui/Icon'
import { buildUploadedFileContent, emptyDraft, itemToDraft, resolveArchiveCategory, stripFileExtension, toPayload } from './archiveModel'
import './archive.css'

export function ArchiveEditorPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { itemId } = useParams()
  const category = resolveArchiveCategory(location.pathname)
  const editingItemId = itemId ? Number(itemId) : null
  const { user, isLoggedIn } = useAuth()
  const [draft, setDraft] = useState(() => ({ ...emptyDraft(category), labName: user?.lab ?? '',
    eventDate: new URLSearchParams(location.search).get('date') || emptyDraft(category).eventDate }))
  const [originalDraft, setOriginalDraft] = useState(draft)
  const [archiveError, setArchiveError] = useState<string | null>(null)
  const [loading, setLoading] = useState(!!itemId)
  const [allowed, setAllowed] = useState(!itemId)
  const [saving, setSaving] = useState(false)
  const [isUploadingArchiveFile, setIsUploadingArchiveFile] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState('')
  const formIsLabs = category === 'labs'
  const listPath = routes.archive[category]
  const closeForm = () => {
    if (JSON.stringify(draft) !== JSON.stringify(originalDraft) && !window.confirm('작성을 취소하고 목록으로 돌아갈까요?')) return
    navigate(listPath)
  }

  useEffect(() => {
    if (!itemId) return
    let active = true
    archiveApi.getItem(Number(itemId)).then((item) => {
      if (!active) return
      if (item.category !== category || !(isAdminUser(user) || isSameUserId(item.ownerId, user?.id))) {
        setArchiveError('자료 수정 권한이 없습니다.')
        return
      }
      setDraft(itemToDraft(item))
      setOriginalDraft(itemToDraft(item))
      setAllowed(true)
    }).catch(() => { if (active) setArchiveError('자료를 불러오지 못했습니다.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [itemId, category, user])

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
        summary: current.summary,
        content: current.content.trim() || buildUploadedFileContent(uploaded),
        tags: current.tags,
      }))
    } catch (error) {
      setArchiveError(error instanceof Error ? error.message : '파일을 업로드하지 못했습니다.')
    } finally {
      setIsUploadingArchiveFile(false)
    }
  }


  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (saving || isUploadingArchiveFile || !allowed) return
    const payload = toPayload(draft)
    if (formIsLabs && (!payload.sourceUrl || !payload.labName || !payload.eventDate)) {
      setArchiveError('연구실명, 날짜, 자료 파일 또는 링크를 입력해 주세요.')
      return
    }
    setSaving(true)
    setArchiveError(null)
    try {
      const saved = editingItemId ? await archiveApi.updateItem(editingItemId, payload) : await archiveApi.createItem(payload)
      navigate(routes.archive.detail(category, saved.id), { replace: true })
    } catch (error) { setArchiveError(error instanceof Error ? error.message : '자료를 저장하지 못했습니다.') }
    finally { setSaving(false) }
  }

  return <PageFrame title={formIsLabs ? '연구실 자료' : '에이전트/스킬'} tone="archive" bodyClassName="archive-content">
    <Link className="archive-back-link" to={listPath} onClick={(event) => { event.preventDefault(); if (!saving && !isUploadingArchiveFile) closeForm() }}><Icon name="chevron-left" size={16} />목록으로 돌아가기</Link>
    {!isLoggedIn ? <div className="archive-empty"><p>로그인 후 자료를 등록할 수 있습니다.</p>
      <Link className="primary-button" to="/login" state={{ from: location }}>로그인</Link></div>
      : loading ? <p role="status">자료를 불러오는 중입니다.</p>
      : !allowed ? <p role="alert">{archiveError}</p>
      : <form className="archive-form archive-editor" onSubmit={handleSubmit}>
                <div className="archive-form-head">
                  <div>
                    <p>{editingItemId ? '자료 수정' : '자료 등록'}</p>
                    <strong>{formIsLabs ? '세미나 자료 / 논문' : '에이전트 / 스킬'}</strong>
                  </div>
                  <button type="button" className="ghost-button" disabled={saving || isUploadingArchiveFile} onClick={closeForm}>취소</button>
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
                          value={draft.labName}
                          onChange={(event) => setDraft((current) => ({ ...current, labName: event.target.value }))}
                          required
                          maxLength={120}
                          placeholder="COALA Lab"
                        />

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
                {archiveError && <p className="auth-error" role="alert">{archiveError}</p>}
                <div className="archive-form-actions">
                  <button type="submit" className="primary-button" disabled={isUploadingArchiveFile || saving}>
                    {saving ? '저장 중' : '저장'}
                  </button>
                </div>
              </form>
    }
  </PageFrame>
}
