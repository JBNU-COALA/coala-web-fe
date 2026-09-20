import { useEffect, useRef, useState } from 'react'
import client from '../../shared/api/client'
import type { ActivityPhoto } from '../../shared/activity'
import { prepareMarkdownImageFile } from '../../shared/markdownImages'
import { Icon } from '../../shared/ui/Icon'

function ProtectedPhoto({ photo }: { photo: ActivityPhoto }) {
  const [source, setSource] = useState('')
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let active = true
    let url = ''
    client.get<Blob>(`/api/attachments/${photo.attachmentId}/download`, { responseType: 'blob' })
      .then(({ data }) => {
        if (!active) return
        url = URL.createObjectURL(data)
        setSource(url)
      })
      .catch(() => { if (active) setFailed(true) })
    return () => { active = false; if (url) URL.revokeObjectURL(url) }
  }, [photo.attachmentId])
  return source
    ? <a href={source} target="_blank" rel="noreferrer" title="원본 사진 보기"><img src={source} alt={photo.originalName} /></a>
    : <span className="activity-photo-placeholder" role="status">{failed ? '사진을 불러오지 못했습니다' : '불러오는 중'}</span>
}

export function ActivityPhotos({ photos, onChange, onBusy }: {
  photos: ActivityPhoto[]
  onChange?: (photos: ActivityPhoto[]) => void
  onBusy?: (busy: boolean) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const upload = async (files: FileList | null) => {
    if (!files?.length || !onChange || busy) return
    if (photos.length + files.length > 5) { setError('사진은 최대 5장까지 첨부할 수 있습니다.'); return }
    setBusy(true)
    onBusy?.(true)
    setError('')
    const next = [...photos]
    try {
      for (const file of Array.from(files)) {
        const body = new FormData()
        body.append('file', await prepareMarkdownImageFile(file))
        const { data } = await client.post<ActivityPhoto>('/api/study/photos', body)
        next.push({ attachmentId: data.attachmentId, originalName: data.originalName })
        onChange([...next])
      }
    } catch {
      setError('사진을 올리지 못했습니다. JPG, PNG, WebP, GIF 파일(10MB 이하)을 확인하고 다시 시도해 주세요.')
    } finally {
      setBusy(false)
      onBusy?.(false)
      if (input.current) input.current.value = ''
    }
  }
  if (!onChange && !photos.length) return null
  return <section className="activity-photos" aria-label="활동 인증 사진">
    <header><h3>인증 사진 <small>{photos.length}/5</small></h3>
      {onChange && <button type="button" className="study-text-button" disabled={busy || photos.length >= 5}
        onClick={() => input.current?.click()}><Icon name="image" size={17} />{busy ? '업로드 중...' : '사진 추가'}</button>}
    </header>
    {onChange && <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple
      hidden aria-label="인증 사진 업로드" onChange={(event) => void upload(event.target.files)} />}
    {photos.length > 0 && <ul className="activity-photo-grid">{photos.map((photo, index) => <li key={photo.attachmentId}>
      <ProtectedPhoto photo={photo} />
      {onChange && <button type="button" disabled={busy} className="activity-photo-remove" aria-label={`사진 ${index + 1} 삭제`}
        title="사진 삭제" onClick={() => onChange(photos.filter((item) => item.attachmentId !== photo.attachmentId))}>×</button>}
    </li>)}</ul>}
    {error && <p role="alert" className="study-error">{error}</p>}
  </section>
}
