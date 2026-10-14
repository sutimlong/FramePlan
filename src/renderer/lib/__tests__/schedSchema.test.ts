import { describe, expect, it } from 'vitest'
import { SCHED_FORMAT_VERSION } from '@shared/schema'
import { createEmptyDocument, defaultVehicleSchedule } from '@/lib/defaults'
import { schedSchema } from '@/lib/schedSchema'

type Raw = Record<string, any>

/** 模擬「從 .sched 檔案讀入的 JSON」：可任意改造內容後再丟進 schema */
const rawDoc = (): Raw => JSON.parse(JSON.stringify(createEmptyDocument()))

const parse = (raw: Raw) => schedSchema.safeParse(raw)

describe('schedSchema 基本結構', () => {
  it('預設文件（createEmptyDocument）可以通過驗證', () => {
    const res = parse(rawDoc())
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.formatVersion).toBe(SCHED_FORMAT_VERSION)
  })

  it('days 至少要有 1 天', () => {
    const empty = rawDoc()
    empty.days = []
    expect(parse(empty).success).toBe(false)

    const missing = rawDoc()
    delete missing.days
    expect(parse(missing).success).toBe(false)
  })

  it('cast.id 不可為空字串', () => {
    const raw = rawDoc()
    raw.cast = [{ id: '', number: 1, characterName: '角色', actorName: '演員' }]
    expect(parse(raw).success).toBe(false)
  })

  it('assets 的 mime 只接受 jpeg / png / webp', () => {
    const gif = rawDoc()
    gif.assets = { a1: { id: 'a1', mime: 'image/gif', dataBase64: '' } }
    expect(parse(gif).success).toBe(false)

    const webp = rawDoc()
    webp.assets = { a1: { id: 'a1', mime: 'image/webp', dataBase64: 'AAAA' } }
    expect(parse(webp).success).toBe(true)
  })
})

describe('schedSchema 的容錯（catch 預設值）', () => {
  it('weather 缺欄位時補上預設值', () => {
    const raw = rawDoc()
    raw.days[0].weather = { condition: 'typhoon', low: 'not-a-number', tempUnit: 'K' }
    const res = parse(raw)
    expect(res.success).toBe(true)
    if (!res.success) return
    expect(res.data.days[0].weather).toMatchObject({
      tempUnit: 'C',
      condition: 'sunny',
      low: null,
      high: null,
      summary: '',
      sunrise: '',
      sunset: '',
    })
  })

  it('rundown 的非法欄位值會被替換為預設值', () => {
    const raw = rawDoc()
    raw.days[0].rundown = [{ id: 's1', kind: 'scene', intExt: 'XX', dayNight: 'MORNING', castIds: 'nope' }]
    const res = parse(raw)
    expect(res.success).toBe(true)
    if (!res.success) return
    const scene = res.data.days[0].rundown[0]
    expect(scene).toMatchObject({
      kind: 'scene',
      time: '',
      intExt: 'INT',
      dayNight: 'D',
      sceneNumber: '',
      cameraMovement: '',
    })
    expect(scene.kind === 'scene' && scene.castIds).toEqual([])
  })

  it('vehicles 型別錯誤時整批視為空陣列', () => {
    const raw = rawDoc()
    raw.vehicles = 'oops'
    const res = parse(raw)
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.vehicles).toEqual([])
  })

  it('rundown 的 kind 不合法時直接失敗（不是容錯欄位）', () => {
    const raw = rawDoc()
    raw.days[0].rundown = [{ id: 'x1', kind: 'unknown' }]
    expect(parse(raw).success).toBe(false)
  })
})

describe('SceneItem.endTime', () => {
  it('有填 endTime 時會保留', () => {
    const raw = rawDoc()
    raw.days[0].rundown = [{ id: 's1', kind: 'scene', time: '07:00', endTime: '09:30' }]
    const res = parse(raw)
    expect(res.success).toBe(true)
    if (!res.success) return
    const item = res.data.days[0].rundown[0]
    expect(item.kind).toBe('scene')
    if (item.kind !== 'scene') return
    expect(item.time).toBe('07:00')
    expect(item.endTime).toBe('09:30')
  })

  it('沒填 endTime 時為 undefined（通告表只顯示開始時間）', () => {
    const raw = rawDoc()
    raw.days[0].rundown = [{ id: 's1', kind: 'scene', time: '07:00' }]
    const res = parse(raw)
    expect(res.success).toBe(true)
    if (!res.success) return
    const item = res.data.days[0].rundown[0]
    expect(item.kind === 'scene' && item.endTime).toBeUndefined()
  })
})

describe('舊版（v2 以前）車表欄位轉換', () => {
  const rawWithSchedule = (): Raw => {
    const raw = rawDoc()
    raw.vehicles = [{ id: 'v1', number: '1', type: 'talent', driverName: '甲', seats: 3 }]
    raw.days[0].vehicleSchedules = {
      v1: {
        ...defaultVehicleSchedule(),
        running: true,
        departureTime: '07:00',
        pickupLocation: '基地營',
        destination: 'custom',
        destinationCustom: '山上停車場',
        passengerIds: ['p1'],
        passengerDetails: {
          p1: {
            boardTime: '07:10',
            boardPlace: 'pickup',
            boardCustom: '',
            alightPlace: 'main',
            alightCustom: '',
            note: '',
          },
        },
      },
    }
    return raw
  }

  it('destination 的自訂文字會成為最終目的地', () => {
    const res = parse(rawWithSchedule())
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.days[0].vehicleSchedules.v1.destination).toBe('山上停車場')
  })

  it('乘客上車地點代碼 pickup 會換成該車的集合地點文字', () => {
    const res = parse(rawWithSchedule())
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.days[0].vehicleSchedules.v1.passengerDetails.p1.boardPlace).toBe('基地營')
      expect(res.data.days[0].vehicleSchedules.v1.passengerDetails.p1.alightPlace).toBe('主拍攝地')
    }
  })

  it('已是自由文字的舊值會原樣保留', () => {
    const raw = rawWithSchedule()
    raw.days[0].vehicleSchedules.v1.passengerDetails.p1.alightPlace = '片場大門'
    const res = parse(raw)
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.days[0].vehicleSchedules.v1.passengerDetails.p1.alightPlace).toBe('片場大門')
  })
})
