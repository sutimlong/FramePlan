import {
  PLACE_KIND_LABELS,
  VEHICLE_TYPE_LABELS,
  type PlaceKind,
  type SchedDocument,
  type ShootDay,
  type Vehicle,
  type VehicleSchedule,
} from '@shared/schema'

export interface Person {
  id: string
  kind: 'cast' | 'crew'
  /** 顯示名稱（演員：角色／演員；工作人員：姓名） */
  name: string
  /** 補充說明（演員編號、職位／部門） */
  sub: string
  phone: string
  /** 當天是否出勤 */
  working: boolean
}

/** 所有可乘車人員（演員 + 工作人員），並標註當天是否出勤 */
export function listPeople(doc: SchedDocument, day: ShootDay): Person[] {
  const deptName = new Map(doc.departments.map((d) => [d.id, d.name]))
  const cast: Person[] = doc.cast.map((c) => ({
    id: c.id,
    kind: 'cast',
    name: c.characterName || c.actorName || '未命名',
    sub: `#${c.number}${c.characterName && c.actorName ? ` ${c.actorName}` : ''}`,
    phone: c.phone ?? '',
    working: day.castCalls[c.id]?.working ?? false,
  }))
  const crew: Person[] = doc.crew.map((m) => ({
    id: m.id,
    kind: 'crew',
    name: m.name || m.position || '未命名',
    sub: [deptName.get(m.departmentId), m.position].filter(Boolean).join('・'),
    phone: m.phone ?? '',
    working: day.crewCalls[m.id]?.working ?? true,
  }))
  return [...cast, ...crew]
}

export const vehicleTypeName = (v: Vehicle): string =>
  v.type === 'custom' ? v.typeLabel || '自訂' : VEHICLE_TYPE_LABELS[v.type]

/** 把地點類型轉成可閱讀文字（含地址），例如「基地營：台北市…」 */
export function resolvePlace(kind: PlaceKind, custom: string, day: ShootDay, sched: VehicleSchedule): string {
  const L = day.locations
  const withAddr = (label: string, addr: string) => (addr.trim() ? `${label}：${addr.trim()}` : label)
  switch (kind) {
    case '':
      return ''
    case 'pickup':
      return sched.pickupLocation.trim() || PLACE_KIND_LABELS.pickup
    case 'office':
      return withAddr(PLACE_KIND_LABELS.office, L.productionOffice.address)
    case 'basecamp':
      return withAddr(PLACE_KIND_LABELS.basecamp, L.basecamp.address)
    case 'main':
      return withAddr(PLACE_KIND_LABELS.main, L.mainShootLocation.address)
    case 'parking':
      return withAddr(PLACE_KIND_LABELS.parking, L.parking.address)
    case 'hospital':
      return withAddr(PLACE_KIND_LABELS.hospital, L.nearestHospital.address)
    case 'custom':
      return custom.trim()
  }
}

/** 當天有出車的車輛（依車輛清單順序） */
export const runningVehicles = (doc: SchedDocument, day: ShootDay): Vehicle[] =>
  doc.vehicles.filter((v) => day.vehicleSchedules[v.id]?.running)

export interface TransportIssue {
  vehicleId: string
  message: string
}

/** 檢查：超載、乘客當天不出勤、同一人同時搭多台車、缺司機／時間 */
export function checkTransport(doc: SchedDocument, day: ShootDay): TransportIssue[] {
  const issues: TransportIssue[] = []
  const people = new Map(listPeople(doc, day).map((p) => [p.id, p]))
  const seen = new Map<string, Vehicle>()
  for (const v of runningVehicles(doc, day)) {
    const s = day.vehicleSchedules[v.id]
    const label = `${v.number || '未編號'} 車`
    if (!v.driverName.trim()) issues.push({ vehicleId: v.id, message: `${label}尚未填寫司機` })
    if (!s.departureTime) issues.push({ vehicleId: v.id, message: `${label}尚未填寫出發時間` })
    if (v.seats && s.passengerIds.length > v.seats) {
      issues.push({ vehicleId: v.id, message: `${label}超載：${s.passengerIds.length} 人 / ${v.seats} 座` })
    }
    for (const pid of s.passengerIds) {
      const p = people.get(pid)
      if (!p) continue
      if (!p.working) issues.push({ vehicleId: v.id, message: `${label}：${p.name} 本日不出勤` })
      const other = seen.get(pid)
      if (other && s.purpose !== 'wrap' && day.vehicleSchedules[other.id]?.purpose !== 'wrap') {
        issues.push({ vehicleId: v.id, message: `${p.name} 同時被排在 ${other.number || '未編號'} 車與 ${v.number || '未編號'} 車` })
      }
      seen.set(pid, v)
    }
  }
  return issues
}
