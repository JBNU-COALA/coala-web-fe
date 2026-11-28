import { afterEach, expect, it } from 'vitest'
import { Editor } from '@tiptap/core'
import { richPostExtensions } from './RichPostEditor'
import { RichPostEditor } from './RichPostEditor'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { useState } from 'react'

let editor: Editor | undefined
it('removes the divider before an ordered-list paragraph without removing numbering', () => {
  editor = new Editor({ extensions: richPostExtensions(), content: { type: 'doc', content: [{ type: 'orderedList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'first' }] }, { type: 'horizontalRule' }, { type: 'paragraph' }] }] }] } })
  let cursor = 0
  editor.state.doc.descendants((node, pos) => { if (node.type.name === 'paragraph' && node.content.size === 0) cursor = pos + 1 })
  editor.commands.setTextSelection(cursor)
  editor.commands.keyboardShortcut('Backspace')
  expect(editor.getJSON().content?.[0].type).toBe('orderedList')
  expect(JSON.stringify(editor.getJSON())).not.toContain('horizontalRule')
  expect(editor.getMarkdown()).toContain('1. first')
})
afterEach(() => { editor?.destroy(); cleanup() })
it('renders a terminal and its language selector when the code button is clicked', async () => {
  function Harness() { const [value, setValue] = useState(''); return <RichPostEditor value={value} onChange={setValue} disabled={false} uploadImage={async () => ''} onError={() => {}} /> }
  render(<Harness />)
  fireEvent.click(screen.getByRole('button', { name: '코드 블록' }))
  expect(await screen.findByRole('combobox', { name: '코드 언어' })).toBeTruthy()
  expect(document.querySelector('.terminal-code-block pre [data-node-view-content]')).not.toBeNull()
})
it('preserves formatted content and code language through markdown editing', () => {
  const content = '# Heading\n\n**bold** and [link](https://example.com)\n\n```javascript\nconst greeting = "hello";\n```\n\n![image](/media/attachments/1/download)\n\n- [x] done'
  editor = new Editor({ extensions: richPostExtensions(), content, contentType: 'markdown' })
  const result = editor.getMarkdown()
  expect(result).toContain('```javascript')
  expect(result).toContain('const greeting = "hello";')
  expect(result).toContain('**bold**')
  expect(result).toContain('/media/attachments/1/download')
  expect(editor.view.dom.querySelector('img')?.getAttribute('src')).toBe(`${window.location.origin}/api/attachments/1/download`)
  expect(result).toContain('[x] done')
  expect(editor.view.dom.querySelector('pre code .hljs-keyword')).not.toBeNull()
  editor.commands.setContent(result, { contentType: 'markdown' })
  expect(editor.getMarkdown()).toBe(result)
})
it('resolves newly inserted attachment images without changing the saved URL', () => {
  editor = new Editor({ extensions: richPostExtensions() })
  editor.commands.setImage({ src: '/media/attachments/2/download' })
  expect(editor.view.dom.querySelector('img')?.getAttribute('src')).toBe(`${window.location.origin}/api/attachments/2/download`)
  expect(editor.getMarkdown()).toContain('/media/attachments/2/download')
})
