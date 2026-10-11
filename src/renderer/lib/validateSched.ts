import { SCHED_FORMAT_VERSION } from '@shared/schema'
import type { SchedDocument } from '@shared/schema'
import { getAppName } from './appInfo'
import { schedSchema } from './schedSchema'
import { uid } from './utils'

type Rec = Record<string, unknown>
const rec = (v: unknown): Rec =>
  typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Rec) : {}
const arr = (v: unknown): Rec[] => (Array.isArray(v) ? v.map(rec) : [])

/** v1（一檔一天）-> v2（一檔多天）：舊檔案會變成只有一天的專案 */
function migrateV1(raw: Rec): Rec {
  const g = rec(raw.general)
  const castCalls: Rec = {}
  for (const c of arr(raw.cast)) {
    if (typeof c.id !== 'string') continue
    castCalls[c.id] = {
      working: true,
      status: c.status,
      transpo: c.transpo,
      callTime: c.callTime,
      blkRhs: c.blkRhs,
      muWard: c.muWard,
      onSet: c.onSet,
      remarks: c.remarks,
    }
  }
  const crewCalls: Rec = {}
  for (const c of arr(raw.crew)) {
    if (typeof c.id === 'string') crewCalls[c.id] = { working: true, callTime: c.callTime }
  }
  return {
    formatVersion: 2,
    meta: raw.meta,
    project: {
      projectName: g.projectName,
      companyName: g.companyName,
      scriptVersion: g.scriptVersion,
      keyPeople: g.keyPeople,
    },
    safetyBanner: raw.safetyBanner,
    cast: raw.cast,
    crew: raw.crew,
    departments: raw.departments,
    usefulContacts: raw.usefulContacts,
    assets: raw.assets,
    days: [
      {
        id: uid(),
        date: g.shootDate,
        crewCall: g.crewCall,
        generalCallNote: g.generalCallNote,
        setMedic: g.setMedic,
        scheduleVersion: g.scheduleVersion,
        locations: raw.locations,
        weather: raw.weather,
        rundown: raw.rundown,
        extras: raw.extras,
        castCalls,
        crewCalls,
        departmentNotes: raw.departmentNotes,
        additionalCrewNotes: raw.additionalCrewNotes,
        quoteOfTheDay: raw.quoteOfTheDay,
      },
    ],
  }
}

export type ParseResult = { ok: true; doc: SchedDocument } | { ok: false; error: string }

export function parseSchedDocument(raw: unknown): ParseResult {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, error: '檔案內容不是有效的通告表' }
  }
  const obj = raw as Rec
  const v = obj.formatVersion
  if (typeof v !== 'number') return { ok: false, error: `缺少 formatVersion，非 ${getAppName()} 檔案` }
  if (v > SCHED_FORMAT_VERSION) {
    return { ok: false, error: `檔案版本 (${v}) 比此程式支援的版本新，請更新 ${getAppName()}` }
  }
  const res = schedSchema.safeParse(v <= 1 ? migrateV1(obj) : obj)
  if (!res.success) {
    const first = res.error.issues[0]
    return { ok: false, error: `檔案格式錯誤：${first.path.join('.')} ${first.message}` }
  }
  return { ok: true, doc: { ...res.data, formatVersion: SCHED_FORMAT_VERSION } as unknown as SchedDocument }
}
