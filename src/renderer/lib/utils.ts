import type { Descendant } from 'slate'
import {
  SCENE_DEPT_NOTE_KEYS,
  SCENE_DEPT_NOTE_LABELS,
  type RichText,
  type SceneDeptNoteKey,
  type SceneDeptNotes,
  type SceneItem,
} from '@shared/schema'

export const uid = (): string => crypto.randomUUID()

export const emptyRich = (): RichText => [{ type: 'paragraph', children: [{ text: '' }] }] as Descendant[]

export const richFromText = (text: string): RichText =>
  [{ type: 'paragraph', children: [{ text }] }] as Descendant[]

interface SlateNodeLike {
  text?: string
  children?: SlateNodeLike[]
}

export function richToPlain(nodes: RichText): string {
  const walk = (n: SlateNodeLike): string => {
    if (typeof n.text === 'string') return n.text
    return (n.children ?? []).map(walk).join('')
  }
  return (nodes as unknown as SlateNodeLike[]).map(walk).join('\n')
}

export const isRichEmpty = (nodes: RichText): boolean => richToPlain(nodes).trim() === ''

/** "YYYY-MM-DD" -> "2025年3月22日 星期六" */
export function formatDateZh(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return iso
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  if (Number.isNaN(d.getTime())) return iso
  const w = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${w}`
}

/** "YYYY-MM-DD" 加上 n 天 */
export function addDaysIso(iso: string, n: number): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const base = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date()
  base.setDate(base.getDate() + n)
  const p = (x: number) => String(x).padStart(2, '0')
  return `${base.getFullYear()}-${p(base.getMonth() + 1)}-${p(base.getDate())}`
}

/** "YYYY-MM-DD" -> "3/22 (六)" */
export function formatDateShort(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return iso || '未設定日期'
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  const w = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
  return `${d.getMonth() + 1}/${d.getDate()} (${w})`
}

/** 現在時間 -> "yyyy.mm.dd - hh:mm:ss"（排程版本未填時，輸出 PDF 使用的自動版本號） */
export function formatTimestamp(d: Date = new Date()): string {
  const p = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} - ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

export function omitKey<T>(rec: Record<string, T>, key: string): Record<string, T> {
  const copy = { ...rec }
  delete copy[key]
  return copy
}

/**
 * 切換部門說明：勾選＝建立空字串欄位；取消勾選＝移除該欄位（已輸入的文字會一併清除）。
 */
export function toggleSceneDeptNote(notes: SceneDeptNotes, key: SceneDeptNoteKey): SceneDeptNotes {
  const next: SceneDeptNotes = { ...notes }
  if (key in next) delete next[key]
  else next[key] = ''
  return next
}

/**
 * 通告表列印用：取出「已勾選且已填寫內容」的部門說明（依 SCENE_DEPT_NOTE_KEYS 順序）。
 * 回傳空陣列＝該場次不印說明列。
 */
export function filledSceneDeptNotes(
  notes: SceneDeptNotes | undefined,
): Array<{ key: SceneDeptNoteKey; label: string; text: string }> {
  return SCENE_DEPT_NOTE_KEYS.flatMap((key) => {
    const text = (notes?.[key] ?? '').trim()
    return text ? [{ key, label: SCENE_DEPT_NOTE_LABELS[key], text }] : []
  })
}

/**
 * 行程表「備註」勾選框是否已勾選。
 * 勾選狀態存在 remarkOn；舊檔沒有旗標、但有已輸入的備註文字時仍視為已勾選，
 * 以免打開舊檔後看不到既有備註。
 */
export function sceneRemarkOn(item: Pick<SceneItem, 'remark' | 'remarkOn'>): boolean {
  return item.remarkOn === true || item.remark.trim() !== ''
}

/**
 * 切換「備註」勾選：勾選＝打開文字框並保留文字；
 * 取消勾選＝關閉文字框並清空文字（與部門說明一致，不保留草稿）。
 * 回傳的物件可直接送進 updateRundownItem。
 */
export function toggleSceneRemark(
  item: Pick<SceneItem, 'remark' | 'remarkOn'>,
): Pick<SceneItem, 'remark' | 'remarkOn'> {
  return sceneRemarkOn(item) ? { remarkOn: false, remark: '' } : { remarkOn: true, remark: item.remark }
}

export const cx = (...a: Array<string | false | null | undefined>): string => a.filter(Boolean).join(' ')

/**
 * 浮動預覽的左上角座標：預設放在游標右下方 gap 處，
 * 右邊或下邊空間不足時翻到游標的左側／上側，並一律夾在 padding 邊界內，
 * 避免預覽被視窗邊緣切掉（視窗比預覽還小時固定在 padding 處）。
 */
export function floatNearCursor(
  cursor: { x: number; y: number },
  size: { width: number; height: number },
  viewport: { width: number; height: number },
  gap = 18,
  padding = 12,
): { x: number; y: number } {
  const x =
    cursor.x + gap + size.width <= viewport.width - padding
      ? cursor.x + gap
      : cursor.x - gap - size.width
  const y =
    cursor.y + gap + size.height <= viewport.height - padding
      ? cursor.y + gap
      : cursor.y - gap - size.height
  const clamp = (v: number, max: number) => Math.min(Math.max(v, padding), Math.max(padding, max))
  return {
    x: clamp(x, viewport.width - padding - size.width),
    y: clamp(y, viewport.height - padding - size.height),
  }
}
