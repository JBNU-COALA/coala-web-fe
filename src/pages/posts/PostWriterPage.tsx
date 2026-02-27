import { useMemo, useRef, useState, type FormEvent } from 'react'
import { Icon } from '../../shared/ui/Icon'

type PostWriterPageProps = {
  onClose: () => void
}

const initialMarkdown = `## 글감 노트
- 소개하고 싶은 이야기나 회고를 간단히 메모하세요.
- 이미지나 링크도 함께 남겨두면 나중에 편해요.

### 작성 팁
1. 문제 상황을 먼저 설명합니다.
2. 해결 과정에서 배운 점을 정리합니다.
3. 다음 계획이나 요청을 덧붙이면 좋아요.
`

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const formatInline = (text: string) => {
  let formatted = escapeHtml(text)
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  formatted = formatted.replace(/__(.+?)__/g, '<strong>$1</strong>')
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>')
  formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>')
  formatted = formatted.replace(/_(.+?)_/g, '<em>$1</em>')
  return formatted
}

const renderMarkdown = (markdown: string) => {
  const lines = markdown.split('\n')
  const html: string[] = []
  let inList = false
  let inCode = false
  let codeLang = ''
  const codeBuffer: string[] = []

  const closeList = () => {
    if (inList) {
      html.push('</ul>')
      inList = false
    }
  }

  const closeCode = () => {
    if (inCode) {
      html.push(
        `<pre><code class="language-${codeLang}">${escapeHtml(codeBuffer.join('\n'))}</code></pre>`,
      )
      codeBuffer.length = 0
      inCode = false
      codeLang = ''
    }
  }

  lines.forEach((rawLine) => {
    const line = rawLine.trimEnd()

    if (line.startsWith('```')) {
      if (inCode) {
        closeCode()
      } else {
        inCode = true
        codeLang = line.replace('```', '').trim() || 'text'
      }
      return
    }

    if (inCode) {
      codeBuffer.push(rawLine)
      return
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      if (!inList) {
        html.push('<ul>')
        inList = true
      }
      html.push(`<li>${formatInline(line.replace(/^\s*[-*+]\s+/, ''))}</li>`)
      return
    }

    closeList()

    if (/^#{1,3}\s/.test(line)) {
      const level = (line.match(/^#{1,3}/)?.[0].length ?? 1) + 1
      const content = line.replace(/^#{1,3}\s*/, '')
      html.push(`<h${level}>${formatInline(content)}</h${level}>`)
      return
    }

    if (line.startsWith('&gt; ') || line.startsWith('> ')) {
      html.push(`<blockquote>${formatInline(line.replace(/^(&gt;|>)\s*/, ''))}</blockquote>`)
      return
    }

    if (line.trim() === '') {
      html.push('<br />')
      return
    }

    html.push(`<p>${formatInline(line)}</p>`)
  })

  closeList()
  closeCode()

  return html.join('')
}

export function PostWriterPage({ onClose }: PostWriterPageProps) {
  const [title, setTitle] = useState('새 글 제목을 입력하세요')
  const [tagsInput, setTagsInput] = useState('커뮤니티, 회고')
  const [body, setBody] = useState(initialMarkdown)
  const editorRef = useRef<HTMLTextAreaElement | null>(null)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')

  const tags = useMemo(
    () => tagsInput.split(',').map((tag) => tag.trim()).filter(Boolean),
    [tagsInput],
  )

  const previewHtml = useMemo(() => renderMarkdown(body), [body])
  const encodedTitle = useMemo(() => encodeURIComponent(title), [title])
  const encodedBody = useMemo(() => encodeURIComponent(body), [body])
  const encodedTags = useMemo(() => encodeURIComponent(tags.join(',')), [tags])

  const handleCopyMarkdown = async () => {
    const fallbackCopy = () => {
      const textarea = document.createElement('textarea')
      textarea.value = body
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
        setCopyState('copied')
      } catch (error) {
        console.error(error)
        setCopyState('error')
      }
      document.body.removeChild(textarea)
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(body)
        setCopyState('copied')
      } else {
        fallbackCopy()
      }
    } catch (error) {
      console.error(error)
      setCopyState('error')
    }

    setTimeout(() => setCopyState('idle'), 2000)
  }

  const handleOpenShare = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const insertSnippet = (prefix: string, suffix = '') => {
    setBody((current) => {
      const editor = editorRef.current
      if (!editor) {
        return `${current}${prefix}${suffix}`
      }

      const { selectionStart, selectionEnd, value } = editor
      const before = value.slice(0, selectionStart)
      const selection = value.slice(selectionStart, selectionEnd)
      const after = value.slice(selectionEnd)
      const placeholder = selection || (suffix ? '내용을 입력하세요' : '')
      const nextValue = `${before}${prefix}${placeholder}${suffix}${after}`

      setTimeout(() => {
        const cursorPosition = before.length + prefix.length + placeholder.length
        editor.selectionStart = cursorPosition
        editor.selectionEnd = cursorPosition
        editor.focus()
      }, 0)

      return nextValue
    })
  }

  const handlePublish = (event: FormEvent) => {
    event.preventDefault()
    console.log('새 게시글 발행 요청', { title, tags, body })
    onClose()
  }

  return (
    <section className="coala-content coala-content--post-writer">
      <form className="surface-card post-writer" onSubmit={handlePublish}>
        <header className="post-writer-header">
          <div>
            <p className="post-writer-label">Community Writing</p>
            <h2 className="post-writer-title">마크다운 에디터</h2>
            <p className="post-writer-subtitle">
              티스토리와 벨로그에서 쓰던 감각 그대로 글을 다듬어 보세요.
            </p>
          </div>

          <div className="post-writer-actions">
            <button type="button" className="ghost-button" onClick={onClose}>
              나가기
            </button>
            <button type="submit" className="write-post-button">
              <Icon name="plus" size={16} />
              발행하기
            </button>
          </div>
        </header>

        <div className="post-writer-fields">
          <input
            className="post-writer-input"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <input
            className="post-writer-input"
            type="text"
            value={tagsInput}
            placeholder="태그는 쉼표로 구분해서 입력하세요"
            onChange={(event) => setTagsInput(event.target.value)}
          />
          <div className="post-writer-taglist">
            {tags.map((tag) => (
              <span key={tag} className="post-tag">
                #{tag}
              </span>
            ))}
          </div>

          <div className="post-writer-toolbar">
            <button type="button" onClick={() => insertSnippet('# ')}>
              H1
            </button>
            <button type="button" onClick={() => insertSnippet('## ')}>
              H2
            </button>
            <button type="button" onClick={() => insertSnippet('**', '**')}>
              굵게
            </button>
            <button type="button" onClick={() => insertSnippet('*', '*')}>
              기울임
            </button>
            <button type="button" onClick={() => insertSnippet('`', '`')}>
              코드
            </button>
            <button type="button" onClick={() => insertSnippet('- ')}>
              목록
            </button>
            <button type="button" onClick={() => insertSnippet('> ')}>
              인용
            </button>
            <button type="button" onClick={() => insertSnippet('\n```\n', '\n```\n')}>
              블록
            </button>
          </div>

          <div className="post-writer-editor">
            <label>
              <span>마크다운</span>
              <textarea
                ref={editorRef}
                value={body}
                onChange={(event) => setBody(event.target.value)}
              />
            </label>
            <div className="post-writer-preview">
              <span>미리보기</span>
              <div
                className="post-writer-preview-body"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>

          <div className="post-writer-share">
            <div>
              <p className="post-writer-share-title">티스토리 · 벨로그 공유</p>
              <p className="post-writer-share-subtitle">
                마크다운을 복사하거나, 외부 블로그 작성 화면을 새 창에서 열 수 있어요.
              </p>
            </div>

            <div className="post-writer-share-actions">
              <button
                type="button"
                className={
                  copyState === 'copied'
                    ? 'ghost-button ghost-button--success'
                    : 'ghost-button'
                }
                onClick={handleCopyMarkdown}
              >
                <Icon name="copy" size={15} />
                <span>
                  {copyState === 'copied'
                    ? '마크다운 복사 완료'
                    : copyState === 'error'
                      ? '복사 오류 다시 시도'
                      : '마크다운 복사'}
                </span>
              </button>

              <button
                type="button"
                className="ghost-button"
                onClick={() =>
                  handleOpenShare(
                    `https://www.tistory.com/write?title=${encodedTitle}&content=${encodedBody}`,
                  )
                }
              >
                <Icon name="link" size={15} />
                티스토리 열기
              </button>

              <button
                type="button"
                className="ghost-button"
                onClick={() =>
                  handleOpenShare(
                    `https://velog.io/write?title=${encodedTitle}&tags=${encodedTags}&body=${encodedBody}`,
                  )
                }
              >
                <Icon name="link" size={15} />
                벨로그 열기
              </button>
            </div>
          </div>
        </div>
      </form>
    </section>
  )
}
