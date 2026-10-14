import { describe, expect, it } from 'vitest'
import { SCHED_FORMAT_VERSION } from '@shared/schema'
import { createEmptyDocument } from '@/lib/defaults'
import { parseSchedDocument } from '@/lib/validateSched'

/** 舊版（v1：一檔一天）的檔案內容範例 */
const V1_DOC = {
  formatVersion: 1,
  meta: { createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-02T00:00:00.000Z', appVersion: '0.9.0' },
  general: {
    projectName: '舊專案',
    companyName: '舊公司',
    scriptVersion: 'v3',
    shootDate: '2024-05-06',
    crewCall: '06:30',
    scheduleVersion: 'A',
    generalCallNote: '颱風備案',
    setMedic: '駐場護理師',
    keyPeople: [{ id: 'k1', title: '導演', name: '王導', phone: '0912345678' }],
  },
  safetyBanner: ['片場禁止吸菸'],
  cast: [
    {
      id: 'c1',
      number: 1,
      characterName: '小明',
      actorName: '李四',
      status: 'SW',
      transpo: '自行前往',
      callTime: '07:00',
      blkRhs: '07:20',
      muWard: '07:00',
      onSet: '07:30',
      remarks: '需要替身',
    },
  ],
  crew: [{ id: 'w1', name: '陳師傅', departmentId: 'd1', position: '攝影師', callTime: '06:00' }],
  departments: [{ id: 'd1', name: '攝影組' }],
  usefulContacts: [],
  assets: {},
  rundown: [{ id: 'r1', kind: 'scene', time: '09:00', sceneNumber: '12', intExt: 'INT', dayNight: 'D' }],
  locations: {
    productionOffice: { label: '製片辦公室', address: '台北市' },
    nearestHospital: { label: '最近醫院', address: '' },
    parking: { label: '停車場', address: '' },
    basecamp: { label: '基地營', address: '' },
    mainShootLocation: { label: '主拍攝地', address: '新北市' },
  },
  weather: { tempUnit: 'C', low: 20, high: 28, condition: 'sunny', summary: '', sunrise: '05:30', sunset: '18:10' },
  extras: [{ id: 'e1', description: '路人', count: 3, callTime: '08:00' }],
  departmentNotes: [],
  quoteOfTheDay: '加油',
}

/** 複製一份可安全改造的 v1 檔案內容 */
const v1 = (): Record<string, any> => JSON.parse(JSON.stringify(V1_DOC))

const expectOk = (raw: unknown) => {
  const res = parseSchedDocument(raw)
  if (!res.ok) throw new Error(`預期解析成功，實際失敗：${res.error}`)
  return res.doc
}

const expectErr = (raw: unknown): string => {
  const res = parseSchedDocument(raw)
  if (res.ok) throw new Error('預期解析失敗，實際成功')
  return res.error
}

describe('parseSchedDocument：基本防護', () => {
  it('非物件內容一律回報非通告表檔案', () => {
    for (const bad of [null, undefined, 42, 'text', [], true]) {
      expect(expectErr(bad)).toBe('檔案內容不是有效的通告表')
    }
  })

  it('缺少 formatVersion 時提示非本程式檔案', () => {
    expect(expectErr({})).toContain('formatVersion')
  })

  it('formatVersion 比程式新時提示更新程式', () => {
    const future = { ...createEmptyDocument(), formatVersion: SCHED_FORMAT_VERSION + 1 }
    expect(expectErr(future)).toContain('比此程式支援的版本新')
  })

  it('格式錯誤時回報第一個問題的路徑與訊息', () => {
    const broken = JSON.parse(JSON.stringify(createEmptyDocument())) as Record<string, any>
    broken.days = []
    const err = expectErr(broken)
    expect(err.startsWith('檔案格式錯誤：')).toBe(true)
    expect(err).toContain('days')
  })

  it('任何輸入都不會拋出例外', () => {
    for (const input of [null, [], 'x', { formatVersion: 'v2' }, { formatVersion: 2, days: [{}] }]) {
      expect(() => parseSchedDocument(input)).not.toThrow()
    }
  })
})

describe('parseSchedDocument：現行版本（v2）', () => {
  it('空文件可以通過並保留 id', () => {
    const doc = createEmptyDocument()
    const parsed = expectOk(JSON.parse(JSON.stringify(doc)))
    expect(parsed.formatVersion).toBe(SCHED_FORMAT_VERSION)
    expect(parsed.days).toHaveLength(1)
    expect(parsed.days[0].id).toBe(doc.days[0].id)
    expect(parsed.project.projectName).toBe('未命名專案')
  })

  it('讀入後 formatVersion 會更新為目前版本', () => {
    const parsed = expectOk(JSON.parse(JSON.stringify(createEmptyDocument())))
    expect(parsed.formatVersion).toBe(SCHED_FORMAT_VERSION)
  })
})

describe('parseSchedDocument：v1 → v2 遷移', () => {
  it('舊檔會變成只有一天的專案', () => {
    const doc = expectOk(v1())
    expect(doc.days).toHaveLength(1)
    expect(doc.days[0].date).toBe('2024-05-06')
    expect(doc.days[0].crewCall).toBe('06:30')
    expect(doc.days[0].id).toBeTruthy()
  })

  it('general 的專案資訊會搬到 project', () => {
    const doc = expectOk(v1())
    expect(doc.project.projectName).toBe('舊專案')
    expect(doc.project.companyName).toBe('舊公司')
    expect(doc.project.scriptVersion).toBe('v3')
    expect(doc.project.keyPeople).toEqual([{ id: 'k1', title: '導演', name: '王導', phone: '0912345678' }])
  })

  it('演員／工作人員的出勤資訊會轉成當天的 castCalls / crewCalls', () => {
    const day = expectOk(v1()).days[0]
    expect(day.castCalls.c1).toMatchObject({
      working: true,
      status: 'SW',
      callTime: '07:00',
      blkRhs: '07:20',
      muWard: '07:00',
      onSet: '07:30',
      remarks: '需要替身',
      transpo: '自行前往',
    })
    expect(day.crewCalls.w1).toEqual({ working: true, callTime: '06:00' })
  })

  it('共用名單（cast / crew / departments）與當天內容原樣保留', () => {
    const doc = expectOk(v1())
    expect(doc.cast).toHaveLength(1)
    expect(doc.cast[0].actorName).toBe('李四')
    expect(doc.crew[0].position).toBe('攝影師')
    expect(doc.departments).toEqual([{ id: 'd1', name: '攝影組' }])
    expect(doc.days[0].rundown[0]).toMatchObject({ kind: 'scene', time: '09:00', sceneNumber: '12' })
    expect(doc.days[0].extras[0]).toMatchObject({ id: 'e1', count: 3, callTime: '08:00' })
    expect(doc.days[0].locations.mainShootLocation.address).toBe('新北市')
    expect(doc.days[0].weather).toMatchObject({ low: 20, high: 28, sunrise: '05:30', sunset: '18:10' })
    expect(doc.days[0].generalCallNote).toBe('颱風備案')
    expect(doc.days[0].setMedic).toBe('駐場護理師')
    expect(doc.days[0].quoteOfTheDay).toBe('加油')
  })

  it('缺少必要共用名單時回報格式錯誤（不崩潰）', () => {
    const broken = v1()
    delete broken.cast
    delete broken.crew
    expect(expectErr(broken)).toContain('檔案格式錯誤：')
  })

  it('遷移後再寫出、再讀入仍可解析（來回轉換穩定）', () => {
    const once = expectOk(v1())
    const twice = expectOk(JSON.parse(JSON.stringify(once)))
    expect(twice.days).toHaveLength(1)
    expect(twice.days[0].castCalls.c1.callTime).toBe('07:00')
    expect(twice.days[0].id).toBe(once.days[0].id)
  })
})
