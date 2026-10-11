import type { ReactNode } from 'react'
import type { RichText } from '@shared/schema'
import '../editor/slate-types'
import type { CustomElement, CustomText } from '../editor/slate-types'

function renderText(t: CustomText, key: number): ReactNode {
  let c: ReactNode = t.text
  if (t.bold) c = <strong>{c}</strong>
  if (t.italic) c = <em>{c}</em>
  if (t.underline) c = <u>{c}</u>
  if (t.highlight) c = <mark>{c}</mark>
  return <span key={key}>{c}</span>
}

function renderNode(n: CustomElement | CustomText, key: number): ReactNode {
  if ('text' in n) return renderText(n, key)
  const kids = n.children.map((c, i) => renderNode(c, i))
  switch (n.type) {
    case 'heading':
      return <h4 key={key}>{kids}</h4>
    case 'bulleted-list':
      return <ul key={key}>{kids}</ul>
    case 'numbered-list':
      return <ol key={key}>{kids}</ol>
    case 'list-item':
      return <li key={key}>{kids}</li>
    default:
      return <p key={key}>{kids}</p>
  }
}

export function RichView({ value }: { value: RichText }) {
  return <div className="rich">{(value as unknown as CustomElement[]).map((n, i) => renderNode(n, i))}</div>
}
