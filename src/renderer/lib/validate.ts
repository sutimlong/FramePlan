import { z } from 'zod'
import { SCHED_FORMAT_VERSION } from '@shared/schema'
import type { RichText, SchedDocument } from '@shared/schema'
import { createEmptyDocument } from './defaults'
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

const scene = z.object({
  id,
  kind: z.literal('scene'),
  time,
  endTime: optStr,
  sceneNumber: str,
  intExt: z.enum(['INT', 'EXT', 'INT/EXT']).catch('INT'),
  dayNight: z.enum(['D', 'N', 'DAWN', 'DUSK']).catch('D'),
  setName: str,
  description: rich,
  castIds: z.array(z.string()).catch([]),
  extrasNote: str,
  pages: str,
  location: str,
})
const brk = z.object({
  id,
  kind: z.literal('break'),
  time,
  label: str,
  durationMin: z.number().optional().catch(undefined),
})

const schema = z.object({
  formatVersion: z.number(),
  meta: z.object({ createdAt: str, updatedAt: str, appVersion: str }),
  general: z.object({
    projectName: str,
    companyName: str,
    shootDate: str,
    dayNumber: z.number().catch(1),
    totalDays: z.number().catch(1),
    crewCall: time,
    generalCallNote: optStr,
    keyPeople: z
      .array(z.object({ id, title: str, name: str, phone: optStr }))
      .catch([]),
    setMedic: str,
    scriptVersion: str,
    scheduleVersion: str,
  }),
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
  safetyBanner: z.array(z.string()).catch([]),
  rundown: z.array(z.discriminatedUnion('kind', [scene, brk])),
  cast: z.array(
    z.object({
      id,
      number: z.number().catch(0),
      characterName: str,
      actorName: str,
      status: z.enum(['SW', 'W', 'WF', 'SWF', 'H', 'R', '-']).catch('-'),
      transpo: str,
      callTime: time,
      blkRhs: time,
      muWard: time,
      onSet: time,
      remarks: str,
      phone: optStr,
      email: optStr,
      photoAssetId: optStr,
    }),
  ),
  extras: z.array(
    z.object({ id, description: str, count: z.number().catch(0), callTime: time, notes: optStr }),
  ),
  crew: z.array(
    z.object({
      id,
      departmentId: str,
      position: str,
      name: str,
      callTime: time,
      phone: optStr,
      email: optStr,
      photoAssetId: optStr,
      notes: optStr,
    }),
  ),
  departments: z.array(z.object({ id, name: str, color: optStr })),
  departmentNotes: z.array(z.object({ id, departmentId: str, content: rich })),
  additionalCrewNotes: rich,
  usefulContacts: z.array(z.object({ id, label: str, name: str, phone: optStr, email: optStr })),
  quoteOfTheDay: str,
  assets: z.record(
    z.string(),
    z.object({
      id,
      mime: z.enum(['image/jpeg', 'image/png', 'image/webp']),
      dataBase64: z.string(),
    }),
  ),
})

/** 對舊版檔案做升級；目前僅有 v1，預留擴充點 */
function migrate(raw: Record<string, unknown>): Record<string, unknown> {
  return raw
}

export type ParseResult = { ok: true; doc: SchedDocument } | { ok: false; error: string }

export function parseSchedDocument(raw: unknown): ParseResult {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, error: '檔案內容不是有效的通告表' }
  }
  const obj = raw as Record<string, unknown>
  const v = obj.formatVersion
  if (typeof v !== 'number') return { ok: false, error: '缺少 formatVersion，非 Callsheet Builder 檔案' }
  if (v > SCHED_FORMAT_VERSION) {
    return { ok: false, error: `檔案版本 (${v}) 比此程式支援的版本新，請更新 Callsheet Builder` }
  }
  const res = schema.safeParse(migrate(obj))
  if (!res.success) {
    const first = res.error.issues[0]
    return { ok: false, error: `檔案格式錯誤：${first.path.join('.')} ${first.message}` }
  }
  const base = createEmptyDocument()
  return { ok: true, doc: { ...base, ...(res.data as SchedDocument) } }
}
