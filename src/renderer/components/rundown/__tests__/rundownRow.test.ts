import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DndContext } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { describe, expect, it } from 'vitest'
import type { BreakItem, RundownItem, SceneItem } from '@shared/schema'
import { emptyRich } from '@/lib/utils'
import { RundownRow } from '../RundownRow'

const scene = (over: Partial<SceneItem> = {}): SceneItem => ({
  id: 's1',
  kind: 'scene',
  time: '08:00',
  sceneNumber: '1',
  shotNumber: '1A',
  cameraMovement: '',
  intExt: 'INT',
  dayNight: 'D',
  setName: '',
  location: '',
  description: emptyRich(),
  castIds: [],
  extrasNote: '',
  remark: '',
  deptNotes: {},
  storyboardAssetIds: [],
  ...over,
})

const brk = (over: Partial<BreakItem> = {}): BreakItem => ({
  id: 'b1',
  kind: 'break',
  time: '12:00',
  label: '午餐',
  durationMin: 60,
  ...over,
})

/** 以 SSR 渲染單一列（node 環境、不需 DOM），回傳其 HTML 字串 */
const renderRow = (item: RundownItem): string =>
  renderToStaticMarkup(
    createElement(DndContext, {
      children: createElement(SortableContext, {
        items: [item.id],
        strategy: verticalListSortingStrategy,
        children: createElement(RundownRow, { item }),
      }),
    }),
  )

/**
 * 拖曳要順的關鍵，是每一列必須把「位移節點」與「動畫節點」拆成兩層，這裡把結構固定下來：
 *   外層 .rundown-item  dnd-kit 的 setNodeRef 目標，只負責 transform 位移。
 *   內層 .rundown-row   framer-motion 的動畫元素，只負責進／退場的高度與透明度。
 * 若兩者合併成同一元素，framer-motion 的 layout 投影會覆寫 transform，拖曳時就會抖動。
 * （此測試只能驗證圖層分工，實際滑順度仍需在應用程式中手動拖曳確認。）
 */
describe('RundownRow 的拖曳圖層', () => {
  const cases: Array<[string, RundownItem, string]> = [
    ['場次', scene(), 'rundown-row scene'],
    ['休息', brk(), 'rundown-row break'],
  ]

  it.each(cases)('%s列：dnd-kit 的位移節點在外、framer-motion 的動畫卡片在內', (_name, item, cls) => {
    const html = renderRow(item)

    const node = html.indexOf('class="rundown-item"')
    const card = html.indexOf(`class="${cls}"`)

    expect(node).toBeGreaterThanOrEqual(0)
    expect(card).toBeGreaterThan(node)
  })

  it.each(cases)('%s列：framer-motion 的動畫卡片只做高度與透明度，不碰 transform', (_name, item, cls) => {
    const html = renderRow(item)
    const cardStyle = html.match(new RegExp(`<div class="${cls}" style="([^"]*)"`))?.[1] ?? ''

    // 動畫卡片必須在位移節點裡面，不能自己就是最外層（否則就會同時被 dnd-kit 寫 transform）
    expect(html).not.toMatch(new RegExp(`^<div class="${cls}"`))
    // 進場動畫：高度與透明度由 framer-motion 負責
    expect(cardStyle).toMatch(/opacity:\s*0/)
    expect(cardStyle).toMatch(/height:\s*0/)
    // 位移必須留給 dnd-kit，動畫卡片不得出現 transform
    expect(cardStyle).not.toContain('transform')
  })

  it.each(cases)('%s列：dnd-kit 的位移節點本身不帶動畫樣式', (_name, item) => {
    const html = renderRow(item)

    // 閒置時 dnd-kit 不會給 transform，因此外層不該有任何 inline style
    expect(html).toMatch(/^<div class="rundown-item"(?!\s+style=)[^>]*>/)
    // 無障礙屬性與拖曳把手都掛在真正的按鈕上
    expect(html).toContain('class="drag-handle"')
    expect(html).toContain('aria-roledescription="sortable"')
    expect(html).toContain('type="button"')
  })
})

/**
 * 場次的「說明」區：六個勾選框（美術／道具／服裝／化妝／髮型／備註）排在同一列，
 * 勾選後才在下方展開對應的文字框；沒勾選就不該有文字框。
 * 「備註」的勾選狀態存在 remarkOn，因此「勾了但還沒輸入」也要展開文字框；
 * 舊檔只有 remark 文字、沒有旗標時，仍要顯示為已勾選（sceneRemarkOn 的相容規則）。
 */
describe('RundownRow 的說明勾選框', () => {
  const checkboxCount = (html: string) => html.match(/type="checkbox"/g)?.length ?? 0
  const noteInputs = (html: string) => html.match(/class="note-input"/g) ?? []
  const noteChecks = (html: string) => html.match(/<div class="note-checks">[\s\S]*?<\/div>/)?.[0] ?? ''
  /** SSR 中已勾選的勾選框會帶 checked 屬性；這裡只看「備註」那一顆 */
  const remarkChecked = /<input type="checkbox" checked=""\/><span>備註<\/span>/

  it('六個勾選框同屬一層 .note-checks：美術／道具／服裝／化妝／髮型／備註', () => {
    const html = renderRow(scene())
    const checks = noteChecks(html)

    expect(checkboxCount(html)).toBe(6)
    for (const label of ['美術說明', '道具說明', '服裝說明', '化妝說明', '髮型說明', '備註']) {
      expect(checks).toContain(`<span>${label}</span>`)
    }
  })

  it('未勾選任何項目時，勾選框下方的 .note-inputs 沒有文字框', () => {
    const html = renderRow(scene())

    expect(html).toContain('class="note-inputs"')
    expect(noteInputs(html)).toHaveLength(0)
  })

  it('勾選的部門才展開文字框，並以該部門名稱當提示文字', () => {
    const html = renderRow(scene({ deptNotes: { art: '桌椅換新' } }))

    expect(noteInputs(html)).toHaveLength(1)
    expect(html).toContain('placeholder="請輸入美術說明"')
    expect(html).toContain('value="桌椅換新"')
  })

  it('備註勾了還沒輸入也要展開文字框（勾選狀態不靠文字判斷）', () => {
    const html = renderRow(scene({ remarkOn: true }))

    expect(noteInputs(html)).toHaveLength(1)
    expect(html).toContain('placeholder="請輸入備註"')
    expect(html).toMatch(remarkChecked)
  })

  it('舊檔的備註已有文字但沒有 remarkOn 旗標時，仍視為已勾選並帶出文字', () => {
    const html = renderRow(scene({ remark: '記得帶證件' }))

    expect(noteInputs(html)).toHaveLength(1)
    expect(html).toContain('value="記得帶證件"')
    expect(html).toMatch(remarkChecked)
  })

  it('多個項目勾選時，文字框依美術／道具／服裝／化妝／髮型／備註的固定順序往下堆疊', () => {
    const html = renderRow(
      scene({ deptNotes: { hair: '假髮 A', makeup: '底妝 B', art: '桌椅換新' }, remarkOn: true }),
    )
    const order = ['請輸入美術說明', '請輸入化妝說明', '請輸入髮型說明', '請輸入備註'].map((p) =>
      html.indexOf(p),
    )

    expect(noteInputs(html)).toHaveLength(4)
    expect(order.every((i) => i >= 0)).toBe(true)
    expect(order).toEqual([...order].sort((a, b) => a - b))
  })

  it('備註不再是上排欄位列的欄位，只留在說明區', () => {
    const html = renderRow(scene({ remark: '記得帶證件' }))

    // 說明區（.scene-notes）之前的 HTML 不該再出現「備註」
    expect(html.split('class="scene-notes"')[0]).not.toContain('備註')
  })

  it('拍攝內容摘要排在說明勾選框上方（兩者位置互換）', () => {
    const html = renderRow(scene())

    const summary = html.indexOf('拍攝內容摘要')
    const checks = html.indexOf('class="note-checks"')

    expect(summary).toBeGreaterThanOrEqual(0)
    expect(checks).toBeGreaterThan(summary)
  })
})
