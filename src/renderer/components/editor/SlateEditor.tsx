import { useCallback, useMemo } from 'react'
import { createEditor, Editor, Element as SlateElement, Transforms } from 'slate'
import type { Descendant } from 'slate'
import { Editable, Slate, withReact, useSlate } from 'slate-react'
import type { RenderElementProps, RenderLeafProps } from 'slate-react'
import { withHistory } from 'slate-history'
import { Bold, Heading2, Highlighter, Italic, List, ListOrdered, Underline } from 'lucide-react'
import type { RichText } from '@shared/schema'
import type { BlockType, CustomText } from './slate-types'
import './slate-types'

type Mark = keyof Omit<CustomText, 'text'>

const LIST_TYPES: BlockType[] = ['bulleted-list', 'numbered-list']

function isMarkActive(editor: Editor, mark: Mark): boolean {
  return Editor.marks(editor)?.[mark] === true
}

function toggleMark(editor: Editor, mark: Mark): void {
  if (isMarkActive(editor, mark)) Editor.removeMark(editor, mark)
  else Editor.addMark(editor, mark, true)
}

function isBlockActive(editor: Editor, type: BlockType): boolean {
  const [match] = Editor.nodes(editor, {
    match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === type,
  })
  return !!match
}

function toggleBlock(editor: Editor, type: BlockType): void {
  const active = isBlockActive(editor, type)
  const isList = LIST_TYPES.includes(type)
  Transforms.unwrapNodes(editor, {
    match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && LIST_TYPES.includes(n.type),
    split: true,
  })
  Transforms.setNodes(editor, { type: active ? 'paragraph' : isList ? 'list-item' : type })
  if (!active && isList) {
    Transforms.wrapNodes(editor, { type, children: [] })
  }
}

function ToolButton({ active, onAction, title, children }: {
  active: boolean
  onAction: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      className={`tool-btn ${active ? 'active' : ''}`}
      onMouseDown={(e) => {
        e.preventDefault()
        onAction()
      }}
    >
      {children}
    </button>
  )
}

function Toolbar() {
  const editor = useSlate()
  const mark = (m: Mark, title: string, icon: React.ReactNode) => (
    <ToolButton active={isMarkActive(editor, m)} title={title} onAction={() => toggleMark(editor, m)}>
      {icon}
    </ToolButton>
  )
  const block = (t: BlockType, title: string, icon: React.ReactNode) => (
    <ToolButton active={isBlockActive(editor, t)} title={title} onAction={() => toggleBlock(editor, t)}>
      {icon}
    </ToolButton>
  )
  return (
    <div className="slate-toolbar">
      {mark('bold', '粗體 (⌘B)', <Bold size={14} />)}
      {mark('italic', '斜體 (⌘I)', <Italic size={14} />)}
      {mark('underline', '底線 (⌘U)', <Underline size={14} />)}
      {mark('highlight', '螢光標示', <Highlighter size={14} />)}
      <span className="tool-sep" />
      {block('heading', '標題', <Heading2 size={14} />)}
      {block('bulleted-list', '項目清單', <List size={14} />)}
      {block('numbered-list', '編號清單', <ListOrdered size={14} />)}
    </div>
  )
}

function Element({ attributes, children, element }: RenderElementProps) {
  switch (element.type) {
    case 'heading':
      return <h3 {...attributes}>{children}</h3>
    case 'bulleted-list':
      return <ul {...attributes}>{children}</ul>
    case 'numbered-list':
      return <ol {...attributes}>{children}</ol>
    case 'list-item':
      return <li {...attributes}>{children}</li>
    default:
      return <p {...attributes}>{children}</p>
  }
}

function Leaf({ attributes, children, leaf }: RenderLeafProps) {
  let c = children
  if (leaf.bold) c = <strong>{c}</strong>
  if (leaf.italic) c = <em>{c}</em>
  if (leaf.underline) c = <u>{c}</u>
  if (leaf.highlight) c = <mark>{c}</mark>
  return <span {...attributes}>{c}</span>
}

interface Props {
  value: RichText
  onChange: (v: RichText) => void
  placeholder?: string
  minHeight?: number
  compact?: boolean
}

export function SlateEditor({ value, onChange, placeholder, minHeight = 80, compact }: Props) {
  const editor = useMemo(() => withHistory(withReact(createEditor())), [])

  const onValue = useCallback(
    (v: Descendant[]) => {
      if (editor.operations.some((op) => op.type !== 'set_selection')) onChange(v)
    },
    [editor, onChange],
  )

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!(e.metaKey || e.ctrlKey)) return
    const map: Record<string, Mark> = { b: 'bold', i: 'italic', u: 'underline' }
    const m = map[e.key.toLowerCase()]
    if (m) {
      e.preventDefault()
      toggleMark(editor, m)
    }
  }

  return (
    <div className={`slate-box ${compact ? 'compact' : ''}`}>
      <Slate editor={editor} initialValue={value} onChange={onValue}>
        {!compact && <Toolbar />}
        <Editable
          className="slate-editable"
          style={{ minHeight }}
          placeholder={placeholder}
          renderElement={(p) => <Element {...p} />}
          renderLeaf={(p) => <Leaf {...p} />}
          onKeyDown={onKeyDown}
        />
      </Slate>
    </div>
  )
}
