import { SCHED_FORMAT_VERSION } from '@shared/schema'
import type {
  CastCall,
  CrewCall,
  Department,
  PassengerDetail,
  PlaceInfo,
  SchedDocument,
  ShootDay,
  VehicleSchedule,
} from '@shared/schema'
import { emptyRich, uid } from './utils'

/**
 * 應用程式版本：由 vite.config.ts 的 define 於建置時注入，來源是 package.json 的 version，
 * 因此與主程序 app.getVersion() 永遠一致（不會出現兩處各寫一份而不同步的情況）。
 * typeof 判斷可讓程式在未經 Vite 處理的環境（例如單元測試）仍可載入。
 */
export const APP_VERSION: string = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0'

export const DEFAULT_SAFETY_BANNER = [
  '未經製片許可，不得強迫加班或帶訪客',
  '片場禁止吸菸',
  '請穿著包覆式鞋子',
  '片場禁止拍照',
]

export const DEFAULT_DEPARTMENT_NAMES = [
  '導演組',
  '製片組',
  '攝影組',
  '燈光組',
  '收音組',
  '美術組',
  '服裝組',
  '梳化組',
  '場務組',
]

const place = (label: string): PlaceInfo => ({ label, address: '', notes: '' })

export function todayIso(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** 演員當天沒有紀錄 = 不出勤 */
export const defaultCastCall = (): CastCall => ({
  working: false,
  status: '-',
  transpo: '',
  callTime: '',
  blkRhs: '',
  muWard: '',
  onSet: '',
  remarks: '',
})

/** 工作人員當天沒有紀錄 = 出勤並沿用總通告 */
export const defaultCrewCall = (): CrewCall => ({ working: true, callTime: '' })

/** 乘客上下車資訊預設值 */
export const defaultPassengerDetail = (): PassengerDetail => ({
  boardTime: '',
  boardPlace: '',
  alightPlace: '',
  note: '',
})

/** 車輛當天沒有紀錄 = 本日不出車 */
export const defaultVehicleSchedule = (): VehicleSchedule => ({
  running: false,
  purpose: '',
  departureTime: '',
  pickupLocation: '',
  transferTime: '',
  arrivalTime: '',
  returnTime: '',
  destination: '',
  passengerIds: [],
  passengerDetails: {},
  passengersNote: '',
  landmarks: '',
  parking: '',
  unloadingZone: '',
  notes: '',
})

export function createEmptyDay(date: string = todayIso()): ShootDay {
  return {
    id: uid(),
    date,
    crewCall: '07:00',
    generalCallNote: '',
    setMedic: '',
    scheduleVersion: '',
    locations: {
      productionOffice: place(''),
      nearestHospital: place('最近醫院'),
      parking: place('停車場'),
      basecamp: place(''),
      mainShootLocation: place('主拍攝地'),
      freeNotes: emptyRich(),
    },
    weather: {
      tempUnit: 'C',
      low: null,
      high: null,
      condition: 'sunny',
      summary: '',
      sunrise: '',
      sunset: '',
    },
    rundown: [],
    extras: [],
    castCalls: {},
    crewCalls: {},
    vehicleSchedules: {},
    departmentNotes: [],
    additionalCrewNotes: emptyRich(),
    quoteOfTheDay: '',
  }
}

/** 複製一天：子項目取得新 id；演員／人員 id 為共用，保持不變 */
export function cloneDay(src: ShootDay, date: string): ShootDay {
  const copy = structuredClone(src)
  return {
    ...copy,
    id: uid(),
    date,
    rundown: copy.rundown.map((r) => ({ ...r, id: uid() })),
    extras: copy.extras.map((x) => ({ ...x, id: uid() })),
    departmentNotes: copy.departmentNotes.map((n) => ({ ...n, id: uid() })),
  }
}

export function createEmptyDocument(): SchedDocument {
  const now = new Date().toISOString()
  const departments: Department[] = DEFAULT_DEPARTMENT_NAMES.map((name) => ({ id: uid(), name }))
  return {
    formatVersion: SCHED_FORMAT_VERSION,
    meta: { createdAt: now, updatedAt: now, appVersion: APP_VERSION },
    project: { projectName: '未命名專案', companyName: '', scriptVersion: '', keyPeople: [] },
    safetyBanner: [...DEFAULT_SAFETY_BANNER],
    cast: [],
    crew: [],
    departments,
    vehicles: [],
    usefulContacts: [],
    assets: {},
    days: [createEmptyDay()],
  }
}
