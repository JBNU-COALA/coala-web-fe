import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Extension } from '@tiptap/core'
import { NodeSelection } from '@tiptap/pm/state'
import { EditorContent, useEditor, NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from '@tiptap/markdown'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Image from '@tiptap/extension-image'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { common, createLowlight } from 'lowlight'
import './richPostEditor.css'
import { Icon } from './Icon'
import { ConfirmDialog } from './ConfirmDialog'

const lowlight = createLowlight(common)
const DividerBackspace = Extension.create({
  name: 'dividerBackspace',
  priority: 1100,
  addKeyboardShortcuts() {
    return { Backspace: () => {
      const { state, view } = this.editor
      const { selection } = state
      if (selection instanceof NodeSelection && selection.node.type.name === 'horizontalRule') {
        view.dispatch(state.tr.delete(selection.from, selection.to)); return true
      }
      if (!selection.empty || selection.$from.parentOffset !== 0) return false
      const cursor = selection.$from
      for (let depth = cursor.depth; depth > 0; depth--) {
        const before = cursor.before(depth)
        const previous = state.doc.resolve(before).nodeBefore
        if (previous?.type.name === 'horizontalRule') {
          view.dispatch(state.tr.delete(before - previous.nodeSize, before)); return true
        }
        if (cursor.index(depth - 1) !== 0) break
      }
      return false
    } }
  },
})
function TerminalBlock({ node, updateAttributes, editor, getPos }: NodeViewProps) {
  const [copied, setCopied] = useState(false)
  return <NodeViewWrapper className="terminal-code-block">
    <div className="terminal-code-header" contentEditable={false}>
      <span>TERMINAL</span>
      <select aria-label="코드 언어" disabled={!editor.isEditable} value={node.attrs.language ?? 'bash'} onChange={(event) => updateAttributes({ language: event.target.value })}>
        {['bash', 'javascript', 'typescript', 'python', 'java', 'json', 'sql', 'css', 'xml', 'yaml', 'plaintext'].map((language) => <option key={language}>{language}</option>)}
      </select>
      <button type="button" aria-label={copied ? '코드 복사 완료' : '코드 복사'} title="코드 복사" onClick={async () => { try { await navigator.clipboard.writeText(node.textContent); setCopied(true) } catch { setCopied(false) } }}><Icon name="copy" size={14} /></button>
    </div>
    <pre><NodeViewContent<'code'> as="code" /></pre>
    <div className="terminal-next-paragraph" contentEditable={false} aria-hidden="true" onMouseDown={(event) => {
      event.preventDefault()
      if (!editor.isEditable) return
      const pos = getPos()
      if (typeof pos !== 'number') return
      const after = pos + node.nodeSize
      const next = editor.state.doc.nodeAt(after)
      if (next?.type.name === 'paragraph') editor.commands.focus(after + 1)
      else editor.chain().insertContentAt(after, { type: 'paragraph' }).focus(after + 1).run()
    }} />
  </NodeViewWrapper>
}
const TerminalCodeBlock = CodeBlockLowlight.extend({ addNodeView() { return ReactNodeViewRenderer(TerminalBlock) } })
export const richPostExtensions = () => [DividerBackspace, StarterKit.configure({ codeBlock: false, trailingNode: false }), Markdown, TerminalCodeBlock.configure({ lowlight, defaultLanguage: 'bash' }), Image, TaskList, TaskItem.configure({ nested: true })]
type Props = { value: string; onChange: (value: string) => void; disabled: boolean; uploadImage: (file: File) => Promise<string>; onError: (message: string) => void }
export function RichPostEditor({ value, onChange, disabled, uploadImage, onError }: Props) {
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkError, setLinkError] = useState('')
  const [tip, setTip] = useState({ text: '', x: 0, y: 0, open: false })
  function showTip(button: HTMLButtonElement, text: string) { const rect = button.getBoundingClientRect(); setTip({ text, x: Math.max(70, Math.min(window.innerWidth - 70, rect.left + rect.width / 2)), y: rect.bottom + 7, open: true }) }
  function hideTip() { setTip((current) => ({ ...current, open: false })) }
  const fileInput = useRef<HTMLInputElement>(null)
  const callbacks = useRef({ onChange, uploadImage, onError })
  callbacks.current = { onChange, uploadImage, onError }
  const editor = useEditor({
    extensions: richPostExtensions(),
    content: value || { type: 'doc', content: [{ type: 'paragraph' }] }, contentType: value ? 'markdown' : 'json', editable: !disabled,
    onUpdate: ({ editor }) => callbacks.current.onChange(editor.getMarkdown()),
    editorProps: {
      attributes: { 'aria-label': '게시글 본문 입력', role: 'textbox', 'aria-multiline': 'true' },
      handleKeyDown: (_view, event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); (_view.dom.closest('form') as HTMLFormElement | null)?.requestSubmit(); return true } return false },
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files ?? []).filter((file) => file.type.startsWith('image/'))
        if (!files.length) return false
        void insertImages(files); return true
      },
      handleDrop: (view, event) => {
        const files = Array.from(event.dataTransfer?.files ?? []).filter((file) => file.type.startsWith('image/'))
        if (!files.length) return false
        const position = view.posAtCoords({ left: event.clientX, top: event.clientY })
        if (position) editor?.commands.setTextSelection(position.pos)
        void insertImages(files); return true
      },
    },
  })
  async function insertImages(files: File[]) {
    for (const file of files) {
      try {
        const src = await callbacks.current.uploadImage(file)
        if (editor && !editor.isDestroyed) editor.chain().focus().setImage({ src }).run()
      } catch (error) { callbacks.current.onError(error instanceof Error ? error.message : '이미지를 첨부하지 못했습니다.') }
    }
  }
  useEffect(() => { if (editor && editor.getMarkdown() !== value) { if (value) editor.commands.setContent(value, { contentType: 'markdown', emitUpdate: false }); else if (!editor.isEmpty) editor.commands.clearContent(false) } }, [editor, value])
  useEffect(() => { editor?.setEditable(!disabled) }, [editor, disabled])
  if (!editor) return null
  const actions = [
    ['굵게', 'B', () => editor.chain().focus().toggleBold().run()],
    ['기울임', 'I', () => editor.chain().focus().toggleItalic().run()],
    ['취소선', 'S', () => editor.chain().focus().toggleStrike().run()],
    ['제목 1', 'H1', () => editor.chain().focus().toggleHeading({ level: 1 }).run()],
    ['제목 2', 'H2', () => editor.chain().focus().toggleHeading({ level: 2 }).run()],
    ['인용', '❞', () => editor.chain().focus().toggleBlockquote().run()],
    ['코드 블록', '</>', () => editor.chain().focus().toggleCodeBlock({ language: 'bash' }).run()],
    ['글머리 목록', <Icon name="list" size={15} />, () => editor.chain().focus().toggleBulletList().run()],
    ['번호 목록', '≡₁', () => editor.chain().focus().toggleOrderedList().run()],
    ['체크 목록', '☑', () => editor.chain().focus().toggleTaskList().run()],
    ['이미지 첨부', <Icon name="image" size={16} />, () => fileInput.current?.click()],
    ['구분선 삽입', '―', () => editor.chain().focus().setHorizontalRule().run()],
    ['링크', <Icon name="link" size={15} />, () => { setLinkUrl(editor.getAttributes('link').href ?? ''); setLinkError(''); setLinkOpen(true) }],
  ] as const
  return <div className="rich-post-editor">
    <div className="rich-post-toolbar" role="toolbar" aria-label="본문 서식">
      {actions.map(([label, text, action]) => <button type="button" key={label} aria-label={label} disabled={disabled} onMouseEnter={(event) => showTip(event.currentTarget, label)} onMouseLeave={hideTip} onFocus={(event) => showTip(event.currentTarget, label)} onBlur={hideTip} onClick={() => { hideTip(); action() }}>{text}</button>)}
    </div>
    <input hidden ref={fileInput} type="file" accept="image/*" multiple onChange={(event) => { void insertImages(Array.from(event.target.files ?? [])); event.target.value = '' }} />
    <EditorContent editor={editor} />
    {createPortal(<div role="tooltip" aria-hidden={!tip.open} className={`rich-editor-tooltip${tip.open ? ' is-open' : ''}`} style={{ left: tip.x, top: tip.y }}>{tip.text}</div>, document.body)}
    <ConfirmDialog open={linkOpen} title="링크 추가" description="연결할 주소를 입력해주세요." confirmLabel="적용" cancelLabel="닫기" onCancel={() => setLinkOpen(false)} onConfirm={() => {
      const url = linkUrl.trim()
      if (url && !/^https?:\/\/\S+$/i.test(url)) { setLinkError('http:// 또는 https:// 주소를 입력해주세요.'); return }
      if (url) { if (editor.state.selection.empty && !editor.isActive('link')) editor.chain().focus().insertContent({ type: 'text', text: url, marks: [{ type: 'link', attrs: { href: url } }] }).run(); else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run() }
      else editor.chain().focus().extendMarkRange('link').unsetLink().run()
      setLinkOpen(false)
    }}>
      <input className="rich-link-input" aria-label="링크 주소" type="url" placeholder="https://" value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') event.preventDefault() }} />
      {linkError && <p role="alert">{linkError}</p>}
    </ConfirmDialog>
  </div>
}
