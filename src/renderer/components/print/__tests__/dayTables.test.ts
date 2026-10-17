import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { SceneItem, ShootDay } from '@shared/schema'
import { createEmptyDocument } from '@/lib/defaults'
import { emptyRich } from '@/lib/utils'
import { ScheduleTable } from '../DayTables'

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

/** 以 SSR 渲染「今日行程」表（node 環境、不需 DOM），回傳其 HTML 字串 */
const render = (rundown: ShootDay['rundown']): string => {
  const doc = createEmptyDocument()
  const day: ShootDay = { ...doc.days[0], rundown }
  return renderToStaticMarkup(createElement(ScheduleTable, { doc, day, index: 0 }))
}

/**
 * 「備註」與部門說明（美術／道具／服裝／化妝／髮型）在通告表上共用同一列，接在該場次列下方：
 * 時間欄以 rowspan 合併兩列，這列橫跨其餘 8 欄（原本獨立的「備註」欄已移除）。
 * 此測試固定這個列結構與顯示規則。
 */
describe('通告表：備註與部門說明合併列', () => {
  it('有填寫說明時，場次列下方多一列說明並橫跨其餘欄位', () => {
    const html = render([
      scene({ deptNotes: { art: '桌椅換新', makeup: '底妝 B', hair: '假髮 A' } }),
    ])
    const row = html.match(/<tr class="cs-notes">[\s\S]*?<\/tr>/)?.[0] ?? ''

    expect(row).toMatch(/<td colspan="8">/i)
    expect(row).toContain('美術說明：桌椅換新')
    expect(row).toContain('化妝說明：底妝 B')
    expect(row).toContain('髮型說明：假髮 A')
    // 順序固定：美術 → 道具 → 服裝 → 化妝 → 髮型
    expect(row.indexOf('美術說明')).toBeLessThan(row.indexOf('化妝說明'))
    expect(row.indexOf('化妝說明')).toBeLessThan(row.indexOf('髮型說明'))
    // 時間欄合併兩列，說明的橫線才不會穿過時間欄
    // （HTML 屬性不分大小寫，React SSR 輸出的是 colSpan／rowSpan）
    expect(html).toMatch(/<td rowspan="2">08:00<\/td>/i)
  })

  it('只勾選沒填、或只填空白時不印說明列，時間欄也不合併', () => {
    const html = render([scene({ deptNotes: { art: '', props: '   ' } })])

    expect(html).not.toContain('cs-notes')
    expect(html).not.toMatch(/rowspan=/i)
  })

  it('未勾選任何部門（deptNotes 為空物件）時不印說明列', () => {
    const html = render([scene()])

    expect(html).not.toContain('cs-notes')
    expect(html).not.toMatch(/rowspan=/i)
  })

  it('只有備註、沒有部門說明時也會印出這列，並標上「備註：」', () => {
    const html = render([scene({ remark: '記得帶證件' })])

    expect(html).toContain('class="cs-notes"')
    expect(html).toContain('備註：記得帶證件')
    expect(html).toMatch(/<td rowspan="2">08:00<\/td>/i)
  })

  it('備註與部門說明同一列，備註排在部門說明之後', () => {
    const html = render([scene({ deptNotes: { art: '桌椅換新' }, remark: '記得帶證件' })])
    const row = html.match(/<tr class="cs-notes">[\s\S]*?<\/tr>/)?.[0] ?? ''

    expect(row).toContain('美術說明：桌椅換新')
    expect(row).toContain('備註：記得帶證件')
    expect(row.indexOf('美術說明')).toBeLessThan(row.indexOf('備註：'))
  })

  it('備註只有空白時不印這列（等同沒有備註）', () => {
    const html = render([scene({ remark: '   ' })])

    expect(html).not.toContain('cs-notes')
    expect(html).not.toMatch(/rowspan=/i)
  })

  it('場次列不再有獨立的「備註」欄，備註只出現在合併列', () => {
    const html = render([scene({ remark: '記得帶證件' })])
    const sceneRow = html.match(/<tr><td rowspan="2">[\s\S]*?<\/tr>/i)?.[0] ?? ''
    const head = html.match(/<thead>[\s\S]*?<\/thead>/)?.[0] ?? ''

    expect(html).not.toContain('<th>備註</th>')
    expect(sceneRow).not.toContain('記得帶證件')
    // 表頭 9 欄，與場次列的欄數一致（時間、場次、鏡號、鏡頭運動、分鏡、場景／內容、演員／臨演、日/夜、地點）
    expect(head.match(/<th>/g)).toHaveLength(9)
    expect(sceneRow.match(/<td/g)).toHaveLength(9)
  })

  it('休息列維持原樣，說明列只跟在有填寫說明的場次後方', () => {
    const html = render([
      scene({ id: 's1', deptNotes: { wardrobe: '學生制服' } }),
      { id: 'b1', kind: 'break', time: '12:00', label: '午餐', durationMin: 60 },
      scene({ id: 's2', time: '13:00' }),
    ])

    expect(html.match(/class="cs-notes"/g)).toHaveLength(1)
    expect(html).toContain('服裝說明：學生制服')
    expect(html).toContain('<tr class="brk">')
    expect(html).toContain('午餐')
    // 休息列橫跨的欄數也少了一欄（9 → 8）
    expect(html).toMatch(/<tr class="brk"><td>12:00<\/td><td colspan="8">/i)
    // 說明列緊接在場次列之後（休息列之前）
    expect(html.search(/rowspan="2"/i)).toBeLessThan(html.indexOf('<tr class="brk">'))
    expect(html.indexOf('class="cs-notes"')).toBeLessThan(html.indexOf('<tr class="brk">'))
  })
})
