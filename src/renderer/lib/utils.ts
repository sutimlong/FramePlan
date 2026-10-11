import type { Descendant } from 'slate'
import type { RichText } from '@shared/schema'

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

/** 解析頁數字串（八分制），例："1 3/8" -> 1.375；"3/8" -> 0.375；"2" -> 2 */
export function parsePages(s: string): number {
  const t = s.trim()
  if (!t) return 0
  const m = t.match(/^(?:(\d+)\s+)?(\d+)\/(\d+)$/)
  if (m) {
    const whole = m[1] ? parseInt(m[1], 10) : 0
    const den = parseInt(m[3], 10)
    return den === 0 ? whole : whole + parseInt(m[2], 10) / den
  }
  const n = parseFloat(t)
  return Number.isFinite(n) ? n : 0
}

/** 將數值轉為八分制字串 */
export function formatPages(v: number): string {
  if (v <= 0) return '0'
  const eighths = Math.round(v * 8)
  const whole = Math.floor(eighths / 8)
  const rem = eighths % 8
  if (rem === 0) return String(whole)
  const g = rem % 4 === 0 ? 4 : rem % 2 === 0 ? 2 : 1
  const frac = `${rem / g}/${8 / g}`
  return whole > 0 ? `${whole} ${frac}` : frac
}

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

export function omitKey<T>(rec: Record<string, T>, key: string): Record<string, T> {
  const copy = { ...rec }
  delete copy[key]
  return copy
}

export const cx = (...a: Array<string | false | null | undefined>): string => a.filter(Boolean).join(' ')

export function addMinutes(time: string, mins: number): string {
  const m = time.match(/^(\d{2}):(\d{2})$/)
  if (!m) return ''
  const total = (parseInt(m[1], 10) * 60 + parseInt(m[2], 10) + mins + 1440) % 1440
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}
