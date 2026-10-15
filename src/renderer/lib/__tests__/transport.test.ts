import { describe, expect, it } from 'vitest'
import type { SchedDocument, ShootDay } from '@shared/schema'
import { createEmptyDocument, defaultCastCall, defaultCrewCall, defaultVehicleSchedule } from '@/lib/defaults'
import { checkTransport, listPeople, runningVehicles, selfDrivingPeople, vehicleTypeName } from '@/lib/transport'

/** 建立測試用文件：2 台車、1 位演員、1 位工作人員，兩台車都出車 */
function fixture(overrides: (doc: SchedDocument, day: ShootDay) => void = () => {}) {
  const doc = createEmptyDocument()
  doc.cast.push({ id: 'c1', number: 1, characterName: '小明', actorName: '李四' })
  doc.crew.push({ id: 'w1', departmentId: doc.departments[0].id, position: '攝影師', name: '陳師傅' })
  doc.vehicles.push(
    { id: 'v1', number: '1', type: 'talent', driverName: '甲司機', seats: 3 },
    { id: 'v2', number: '2', type: 'van', driverName: '乙司機', seats: 4 },
  )
  const day = doc.days[0]
  day.castCalls.c1 = { ...defaultCastCall(), working: true, callTime: '07:00' }
  day.crewCalls.w1 = { ...defaultCrewCall(), working: true, callTime: '06:30' }
  day.vehicleSchedules.v1 = { ...defaultVehicleSchedule(), running: true, departureTime: '07:00', passengerIds: ['c1'] }
  day.vehicleSchedules.v2 = { ...defaultVehicleSchedule(), running: true, departureTime: '07:30', passengerIds: ['w1'] }
  overrides(doc, day)
  return { doc, day }
}

const messages = (doc: SchedDocument, day: ShootDay) => checkTransport(doc, day).map((i) => i.message)

describe('listPeople / runningVehicles', () => {
  it('列出演員與工作人員並標註出勤狀態', () => {
    const { doc, day } = fixture()
    const people = listPeople(doc, day)
    expect(people.map((p) => p.id)).toEqual(['c1', 'w1'])
    expect(people[0]).toMatchObject({ kind: 'cast', name: '小明', working: true })
    expect(people[1]).toMatchObject({ kind: 'crew', name: '陳師傅', working: true })
  })

  it('演員沒有當天紀錄視為不出勤，工作人員則預設出勤', () => {
    const { doc, day } = fixture()
    day.castCalls.c1.working = false
    delete day.crewCalls.w1
    const people = listPeople(doc, day)
    expect(people.find((p) => p.id === 'c1')?.working).toBe(false)
    expect(people.find((p) => p.id === 'w1')?.working).toBe(true)
  })

  it('只回傳當天有出車的車輛', () => {
    const { doc, day } = fixture((_doc, d) => {
      d.vehicleSchedules.v2.running = false
    })
    expect(runningVehicles(doc, day).map((v) => v.id)).toEqual(['v1'])
  })

  it('自訂車型顯示 typeLabel，其餘使用對照表名稱', () => {
    const { doc } = fixture((d) => {
      d.vehicles.push({ id: 'v3', number: '3', type: 'custom', typeLabel: '餐車', driverName: '' })
    })
    const [v1, , v3] = doc.vehicles
    expect(vehicleTypeName(v1)).toBeTruthy()
    expect(vehicleTypeName(v3)).toBe('餐車')
  })
})

describe('checkTransport：正常情況', () => {
  it('司機、出發時間與乘客都齊全時沒有問題', () => {
    const { doc, day } = fixture()
    expect(messages(doc, day)).toEqual([])
  })

  it('不出車的車輛完全不檢查（即使沒司機、沒時間）', () => {
    const { doc, day } = fixture((d, day_) => {
      d.vehicles[1].driverName = ''
      day_.vehicleSchedules.v2.running = false
      day_.vehicleSchedules.v2.departureTime = ''
      day_.vehicleSchedules.v2.passengerIds = ['c1'] // 與 1 車重複也不該被檢查
    })
    expect(messages(doc, day)).toEqual([])
  })

  it('找不到的人員 id 會被忽略而不是崩潰', () => {
    const { doc, day } = fixture((_doc, d) => {
      d.vehicleSchedules.v1.passengerIds = ['ghost', 'c1']
    })
    expect(messages(doc, day)).toEqual([])
  })
})

describe('checkTransport：缺司機與出發時間', () => {
  it('缺少司機與出發時間時各回報一筆', () => {
    const { doc, day } = fixture((d, day_) => {
      d.vehicles[0].driverName = '  '
      day_.vehicleSchedules.v1.departureTime = ''
    })
    expect(messages(doc, day)).toEqual(['1 車尚未填寫司機', '1 車尚未填寫出發時間'])
  })

  it('沒有車號時以「未編號」表示', () => {
    const { doc, day } = fixture((d, day_) => {
      d.vehicles[0].number = ''
      d.vehicles[0].driverName = ''
      day_.vehicleSchedules.v1 = { ...day_.vehicleSchedules.v1, running: true }
    })
    expect(messages(doc, day)).toContain('未編號 車尚未填寫司機')
  })
})

describe('checkTransport：超載與重複乘客', () => {
  it('座位數不足時回報超載', () => {
    const { doc, day } = fixture((d, day_) => {
      d.vehicles[0].seats = 1
      day_.vehicleSchedules.v1.passengerIds = ['c1', 'w1']
      day_.vehicleSchedules.v2.passengerIds = []
    })
    expect(messages(doc, day)).toEqual(['1 車超載：2 人 / 1 座'])
  })

  it('同一台車重複列出同一位乘客不會被誤報超載或「同時被排」', () => {
    const { doc, day } = fixture((_doc, d) => {
      d.vehicleSchedules.v1.passengerIds = ['c1', 'c1', 'c1']
    })
    const msgs = messages(doc, day)
    expect(msgs).toEqual([])
  })

  it('座位數剛好等於去重後人數時不算超載', () => {
    const { doc, day } = fixture((d, day_) => {
      d.vehicles[0].seats = 1
      day_.vehicleSchedules.v1.passengerIds = ['c1', 'c1']
    })
    expect(messages(doc, day)).toEqual([])
  })

  it('沒填座位數時不檢查超載', () => {
    const { doc, day } = fixture((d, day_) => {
      d.vehicles[0].seats = undefined
      day_.vehicleSchedules.v1.passengerIds = ['c1', 'w1']
      day_.vehicleSchedules.v2.passengerIds = []
    })
    expect(messages(doc, day)).toEqual([])
  })
})

describe('checkTransport：人員安排', () => {
  it('乘客當天不出勤會回報', () => {
    const { doc, day } = fixture((_doc, d) => {
      d.castCalls.c1.working = false
    })
    expect(messages(doc, day)).toEqual(['1 車：小明 本日不出勤'])
  })

  it('同一人被排在兩台車會回報', () => {
    const { doc, day } = fixture((_doc, d) => {
      d.vehicleSchedules.v2.passengerIds = ['c1']
    })
    expect(messages(doc, day)).toEqual(['小明 同時被排在 1 車與 2 車'])
  })

  it('其中一台車是收工車（wrap）時不算衝突', () => {
    const { doc, day } = fixture((_doc, d) => {
      d.vehicleSchedules.v2.passengerIds = ['c1']
      d.vehicleSchedules.v2.purpose = 'wrap'
    })
    expect(messages(doc, day)).toEqual([])
  })
})

describe('selfDrivingPeople', () => {
  it('所有人都有排車時回傳空陣列', () => {
    const { doc, day } = fixture()
    expect(selfDrivingPeople(doc, day)).toEqual([])
  })

  it('有出勤但未排車者視為自行前往', () => {
    const { doc, day } = fixture((_d, d) => {
      d.vehicleSchedules.v2.passengerIds = []
    })
    expect(selfDrivingPeople(doc, day).map((p) => p.id)).toEqual(['w1'])
  })

  it('未出勤者不算自行前往', () => {
    const { doc, day } = fixture((_d, d) => {
      d.vehicleSchedules.v2.passengerIds = []
      d.crewCalls.w1.working = false
    })
    expect(selfDrivingPeople(doc, day)).toEqual([])
  })
})
