import { useState, type FormEvent } from 'react'
import { adminApi } from '../../shared/api/admin'
import type { BoardCategoryKey, BoardData, BoardType } from '../../shared/api/boards'
import { Icon } from '../../shared/ui/Icon'
import { AdminField as Field } from './AdminFields'

const boardTypes: Record<BoardType, string> = { NORMAL: '일반', RECRUIT: '모집', ANONYMOUS: '익명' }
const boardCategories: Record<BoardCategoryKey, string> = {
  notice: '공지', free: '자유', humor: '유머', news: '소식', contest: '대회', lab: '연구실', resource: '자료',
}

export function AdminBoardsPanel({ boards, onChange }: { boards: BoardData[]; onChange: (boards: BoardData[]) => void }) {
  const [selectedId, setSelectedId] = useState<number | null>(boards[0]?.boardId ?? null)
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const selected = boards.find((board) => board.boardId === selectedId)
  const filtered = boards.filter((board) => `${board.boardName} ${board.description}`.toLowerCase().includes(query.trim().toLowerCase()))
  return <div className="admin-two-column">
    <section className="admin-panel">
      <div className="admin-panel-header"><h3>게시판 목록</h3><button type="button" className="admin-ghost-button" disabled={busy} onClick={() => setSelectedId(null)}><Icon name="plus" size={15} />게시판 추가</button></div>
      <label className="admin-member-search"><Icon name="search" size={16} /><input aria-label="게시판 검색" placeholder="게시판 검색" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
      <div className="admin-list">{filtered.map((board) => <button type="button" key={board.boardId} disabled={busy} aria-pressed={selectedId === board.boardId}
        className={`admin-list-row${selectedId === board.boardId ? ' is-active' : ''}`} onClick={() => setSelectedId(board.boardId)}>
        <span>{board.boardName}</span><small>{boardTypes[board.boardType]}{board.categoryKey ? ` · ${boardCategories[board.categoryKey]}` : ''} · {board.description || '설명 없음'}</small><b>{board.isActive ? '공개' : '비활성'}</b>
      </button>)}{!filtered.length && <p className="admin-empty">게시판이 없습니다.</p>}</div>
    </section>
    <BoardEditor key={selected?.boardId ?? 'new'} board={selected} onBusy={setBusy} onSave={(saved) => {
      onChange(boards.some((item) => item.boardId === saved.boardId) ? boards.map((item) => item.boardId === saved.boardId ? saved : item) : [...boards, saved])
      setSelectedId(saved.boardId)
    }} />
  </div>
}

function BoardEditor({ board, onSave, onBusy }: { board?: BoardData; onSave: (board: BoardData) => void; onBusy: (busy: boolean) => void }) {
  const [name, setName] = useState(board?.boardName ?? '')
  const [description, setDescription] = useState(board?.description ?? '')
  const [type, setType] = useState<BoardType>(board?.boardType ?? 'NORMAL')
  const [category, setCategory] = useState<BoardCategoryKey>(board?.categoryKey ?? 'free')
  const [active, setActive] = useState(board?.isActive ?? true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  async function save(event: FormEvent) {
    event.preventDefault()
    if (saving || !name.trim()) return
    if (board?.isActive && !active && !window.confirm(`${board.boardName} 게시판을 비활성화할까요?`)) return
    setSaving(true)
    onBusy(true)
    setMessage('')
    try {
      if (board) {
        await adminApi.updateBoard(board.boardId, { boardName: name.trim(), description: description.trim(), isActive: active })
        onSave({ ...board, boardName: name.trim(), description: description.trim(), isActive: active })
      } else {
        const created = await adminApi.createBoard({ boardName: name.trim(), description: description.trim(), boardType: type, ...(type === 'NORMAL' ? { categoryKey: category } : {}) })
        onSave({ ...created, description: description.trim(), boardType: type, categoryKey: type === 'NORMAL' ? category : null, isActive: true, updatedAt: created.createdAt })
      }
      setMessage('게시판을 저장했습니다.')
    } catch { setMessage('게시판 저장에 실패했습니다. 입력 내용은 유지됩니다.') }
    finally { setSaving(false); onBusy(false) }
  }
  return <form className="admin-panel admin-form" onSubmit={(event) => void save(event)}>
    <div className="admin-panel-header"><h3>{board ? '게시판 수정' : '게시판 추가'}</h3>{board && <span>#{board.boardId}</span>}</div>
    <fieldset className="admin-fieldset" disabled={saving}>
      <Field label="게시판 이름"><input required maxLength={50} value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="설명"><textarea maxLength={255} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
      <Field label="유형"><select value={type} disabled={!!board} onChange={(e) => setType(e.target.value as BoardType)}>{Object.entries(boardTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
      {type === 'NORMAL' && <Field label="분류"><select value={board && !board.categoryKey ? '' : category} disabled={!!board} onChange={(e) => setCategory(e.target.value as BoardCategoryKey)}>
        {board && !board.categoryKey && <option value="">분류 미확인</option>}
        {Object.entries(boardCategories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></Field>}
      {board && <label className="admin-toggle"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />공개</label>}
      <button type="submit" className="admin-primary-button" disabled={!name.trim()}><Icon name="edit" size={15} />{saving ? '저장 중...' : '게시판 저장'}</button>
    </fieldset>
    <p className="admin-feedback" role="status">{message}</p>
  </form>
}
