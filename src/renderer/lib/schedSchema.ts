import { z } from 'zod'
import type { RichText } from '@shared/schema'
import { emptyRich } from './utils'

const rich = z
  .array(z.custom<RichText[number]>((v) => typeof v === 'object' && v !== null))
  .catch(() => emptyRich())

const time = z.string().catch('')
const str = z.string().catch('')
const optStr = z.string().optional().catch(undefined)
const id = z.string().min(1)

const place = z.object({
  label: str,
  address: str,
  notes: optStr,
  lat: z.number().optional().catch(undefined),
  lng: z.number().optional().catch(undefined),
})

/** 部門說明文字：型別錯誤一律視為空字串 */
const deptNoteText = z.string().catch('')
/** 只保留五個已知的 key（未知 key 由 z.object 預設 strip 掉）；整欄缺漏／型別錯誤 → {} */
const deptNotes = z
  .object({
    art: deptNoteText.optional(),
    props: deptNoteText.optional(),
    wardrobe: deptNoteText.optional(),
    makeup: deptNoteText.optional(),
    hair: deptNoteText.optional(),
  })
  .catch({})

const scene = z.object({
  id,
  kind: z.literal('scene'),
  time,
  endTime: optStr,
  sceneNumber: str,
  shotNumber: str,
  cameraMovement: str,
  customCameraMovement: optStr,
  intExt: z.enum(['INT', 'EXT', 'INT/EXT']).catch('INT'),
  dayNight: z.enum(['D', 'N', 'DAWN', 'DUSK']).catch('D'),
  setName: str,
  description: rich,
  castIds: z.array(z.string()).catch([]),
  extrasNote: str,
  location: str,
  remark: str,
  /** 備註勾選框的狀態（舊檔缺漏或型別錯誤 → 未勾選） */
  remarkOn: z.boolean().catch(false),
  deptNotes,
  storyboardAssetIds: z.array(z.string()).catch([]),
})
const brk = z.object({
  id,
  kind: z.literal('break'),
  time,
  label: str,
  durationMin: z.number().optional().catch(undefined),
})

const castCall = z.object({
  working: z.boolean().catch(false),
  status: z.enum(['SW', 'W', 'WF', 'SWF', 'H', 'R', '-']).catch('-'),
  transpo: str,
  callTime: time,
  blkRhs: time,
  muWard: time,
  onSet: time,
  remarks: str,
})
const crewCall = z.object({ working: z.boolean().catch(true), callTime: time })

const vehicle = z.object({
  id,
  number: str,
  type: z
    .enum(['talent', 'van', 'equipment', 'lighting', 'art', 'makeup', 'production', 'shuttle', 'custom'])
    .catch('talent'),
  typeLabel: optStr,
  driverName: str,
  driverPhone: optStr,
  plateNumber: optStr,
  seats: z.number().optional().catch(undefined),
  notes: optStr,
})
const passengerDetail = z.object({
  boardTime: time,
  // 舊檔（v2 以前）為地點代碼（pickup／basecamp…）+ 自訂文字，於 vehicleSchedule 轉成自由文字
  boardPlace: str,
  boardCustom: str,
  alightPlace: str,
  alightCustom: str,
  note: str,
})

/** 舊檔的地點代碼 → 顯示文字（僅用於讀取舊檔） */
const LEGACY_PLACE_LABELS: Record<string, string> = {
  pickup: '集合地點（早餐點／飯店）',
  office: '製片辦公室',
  basecamp: '基地營',
  main: '主拍攝地',
  parking: '停車場',
  hospital: '最近醫院',
}

/** 地點欄位一律自由填寫：舊檔的代碼轉成文字，已是自填文字則原樣保留 */
function placeText(value: string, custom: string, pickup: string): string {
  const text = value.trim()
  if (!text) return ''
  if (text === 'custom') return custom.trim()
  const label = LEGACY_PLACE_LABELS[text]
  if (!label) return text
  return text === 'pickup' ? pickup.trim() || label : label
}

const vehicleSchedule = z
  .object({
    // 舊檔案的既有車表視為「出車」
    running: z.boolean().catch(true),
    purpose: z.enum(['', 'talent-in', 'crew-shuttle', 'equipment', 'transfer', 'wrap', 'errand', 'other']).catch(''),
    departureTime: time,
    pickupLocation: str,
    transferTime: time,
    arrivalTime: time,
    returnTime: time,
    destination: str,
    destinationCustom: str,
    passengerIds: z.array(z.string()).catch([]),
    passengerDetails: z.record(z.string(), passengerDetail).catch({}),
    passengersNote: str,
    landmarks: str,
    parking: str,
    unloadingZone: str,
    notes: str,
  })
  .transform(({ destination, destinationCustom, passengerDetails, ...rest }) => ({
    ...rest,
    destination: placeText(destination, destinationCustom, rest.pickupLocation),
    passengerDetails: Object.fromEntries(
      Object.entries(passengerDetails).map(([pid, d]) => [
        pid,
        {
          boardTime: d.boardTime,
          boardPlace: placeText(d.boardPlace, d.boardCustom, rest.pickupLocation),
          alightPlace: placeText(d.alightPlace, d.alightCustom, rest.pickupLocation),
          note: d.note,
        },
      ]),
    ),
  }))

const day = z.object({
  id,
  date: str,
  crewCall: time,
  generalCallNote: optStr,
  setMedic: str,
  scheduleVersion: str,
  locations: z.object({
    productionOffice: place,
    nearestHospital: place,
    parking: place,
    basecamp: place,
    mainShootLocation: place,
    freeNotes: rich,
  }),
  weather: z.object({
    tempUnit: z.enum(['C', 'F']).catch('C'),
    low: z.number().nullable().catch(null),
    high: z.number().nullable().catch(null),
    condition: z
      .enum(['sunny', 'partly-cloudy', 'cloudy', 'rain', 'snow', 'storm', 'fog'])
      .catch('sunny'),
    summary: str,
    sunrise: time,
    sunset: time,
  }),
  rundown: z.array(z.discriminatedUnion('kind', [scene, brk])),
  extras: z.array(
    z.object({ id, description: str, count: z.number().catch(0), callTime: time, notes: optStr }),
  ),
  castCalls: z.record(z.string(), castCall).catch({}),
  crewCalls: z.record(z.string(), crewCall).catch({}),
  vehicleSchedules: z.record(z.string(), vehicleSchedule).catch({}),
  departmentNotes: z.array(z.object({ id, departmentId: str, content: rich })),
  additionalCrewNotes: rich,
  quoteOfTheDay: str,
})

export const schedSchema = z.object({
  formatVersion: z.number(),
  meta: z.object({ createdAt: str, updatedAt: str, appVersion: str }),
  project: z.object({
    projectName: str,
    companyName: str,
    scriptVersion: str,
    keyPeople: z.array(z.object({ id, title: str, name: str, phone: optStr })).catch([]),
  }),
  safetyBanner: z.array(z.string()).catch([]),
  cast: z.array(
    z.object({
      id,
      number: z.number().catch(0),
      characterName: str,
      actorName: str,
      phone: optStr,
      email: optStr,
      photoAssetId: optStr,
    }),
  ),
  crew: z.array(
    z.object({
      id,
      departmentId: str,
      position: str,
      name: str,
      phone: optStr,
      email: optStr,
      photoAssetId: optStr,
      notes: optStr,
    }),
  ),
  departments: z.array(z.object({ id, name: str, color: optStr })),
  vehicles: z.array(vehicle).catch([]),
  usefulContacts: z.array(z.object({ id, label: str, name: str, phone: optStr, email: optStr })),
  assets: z.record(
    z.string(),
    z.object({
      id,
      mime: z.enum(['image/jpeg', 'image/png', 'image/webp']),
      dataBase64: z.string(),
    }),
  ),
  days: z.array(day).min(1),
})
