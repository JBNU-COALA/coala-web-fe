import { useState, type FormEvent } from 'react'
import type { UserData } from '../../shared/api/auth'
import { adminApi } from '../../shared/api/admin'
import { userDetailsDraft, userDetailsPayload } from '../../shared/api/userDetails'
import { UserDetailsFields } from '../../shared/ui/UserDetailsFields'

export function AdminUserEditor({ user, onSave }: { user: UserData; onSave: (user: UserData) => void }) {
  const [draft, setDraft] = useState(() => userDetailsDraft(user))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setMessage('')
    try {
      const saved = await adminApi.updateUserProfile(user.id, userDetailsPayload(draft))
      setDraft(userDetailsDraft(saved))
      onSave(saved)
      setMessage('회원정보를 저장했습니다.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '저장하지 못했습니다.')
    } finally { setSaving(false) }
  }
  return <form className="admin-user-editor" onSubmit={(event) => void submit(event)}>
    <UserDetailsFields value={draft} onChange={setDraft} email={user.email} disabled={saving} />
    <div className="admin-user-editor-actions">
      <p role="status">{message}</p>
      <button type="submit" className="admin-primary-button" disabled={saving}>{saving ? '저장 중' : '정보 저장'}</button>
    </div>
  </form>
}
