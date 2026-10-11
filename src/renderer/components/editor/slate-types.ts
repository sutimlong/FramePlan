import type { BaseEditor } from 'slate'
import type { HistoryEditor } from 'slate-history'
import type { ReactEditor } from 'slate-react'

export type BlockType = 'paragraph' | 'heading' | 'bulleted-list' | 'numbered-list' | 'list-item'

export interface CustomText {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  highlight?: boolean
}

export interface CustomElement {
  type: BlockType
  children: Array<CustomElement | CustomText>
}

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor
    Element: CustomElement
    Text: CustomText
  }
}
