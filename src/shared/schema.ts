import type { Descendant } from 'slate'

export const SCHED_FORMAT_VERSION = 2

export type ID = string
export type TimeString = string
export type RichText = Descendant[]

export type IntExt = 'INT' | 'EXT' | 'INT/EXT'
export type DayNight = 'D' | 'N' | 'DAWN' | 'DUSK'
export type TalentStatus = 'SW' | 'W' | 'WF' | 'SWF' | 'H' | 'R' | '-'

export const TALENT_STATUS_LABELS: Record<TalentStatus, string> = {
  '-': '—',
  'SW': '開工',
  'W': '工作',
  'WF': '收工',
  'SWF': '當天進出',
  'H': '待命',
  'R': '排練',
}
/** 車型 */
export type VehicleType =
  | 'talent'
  | 'van'
  | 'equipment'
  | 'lighting'
  | 'art'
  | 'makeup'
  | 'production'
  | 'shuttle'
  | 'custom'

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  'talent': '保母車',
  'van': '七人座／小客車',
  'equipment': '燈/機具大貨車',
  'lighting': '燈光／攝影車',
  'art': '美術／道具車',
  'makeup': '梳化車',
  'production': '製片車',
  'shuttle': '工作人員接駁車',
  'custom': '其他／自訂',
}

/** 上下車地點類型：選單項目會連動當天通告的地點資訊 */
export type PlaceKind = '' | 'pickup' | 'office' | 'basecamp' | 'main' | 'parking' | 'hospital' | 'custom'

export const PLACE_KIND_LABELS: Record<PlaceKind, string> = {
  '': '—',
  'pickup': '集合地點（早餐點／飯店）',
  'office': '製片辦公室',
  'basecamp': '基地營',
  'main': '主拍攝地',
  'parking': '停車場',
  'hospital': '最近醫院',
  'custom': '自訂地點',
}

/** 出車任務 */
export type VehiclePurpose = '' | 'talent-in' | 'crew-shuttle' | 'equipment' | 'transfer' | 'wrap' | 'errand' | 'other'

export const VEHICLE_PURPOSE_LABELS: Record<VehiclePurpose, string> = {
  '': '—',
  'talent-in': '接演員上工',
  'crew-shuttle': '工作人員接駁',
  'equipment': '器材運送',
  'transfer': '場景轉場',
  'wrap': '收工送返',
  'errand': '採買／雜支',
  'other': '其他',
}

export type WeatherCondition =
  | 'sunny'
  | 'partly-cloudy'
  | 'cloudy'
  | 'rain'
  | 'snow'
  | 'storm'
  | 'fog'

export interface DocumentMeta {
  createdAt: string
  updatedAt: string
  appVersion: string
}

export interface KeyPerson {
  id: ID
  title: string
  name: string
  phone?: string
}

/** 專案層級（所有天數共用） */
export interface ProjectInfo {
  projectName: string
  companyName: string
  scriptVersion: string
  keyPeople: KeyPerson[]
}

export interface PlaceInfo {
  label: string
  address: string
  notes?: string
  lat?: number
  lng?: number
}

export interface LocationBlock {
  productionOffice: PlaceInfo
  nearestHospital: PlaceInfo
  parking: PlaceInfo
  basecamp: PlaceInfo
  mainShootLocation: PlaceInfo
  freeNotes: RichText
}

export interface WeatherInfo {
  tempUnit: 'C' | 'F'
  low: number | null
  high: number | null
  condition: WeatherCondition
  summary: string
  sunrise: TimeString
  sunset: TimeString
}

export interface SceneItem {
  id: ID
  kind: 'scene'
  time: TimeString
  endTime?: TimeString
  sceneNumber: string
  intExt: IntExt
  dayNight: DayNight
  setName: string
  description: RichText
  castIds: ID[]
  extrasNote: string
  pages: string
  location: string
}

export interface BreakItem {
  id: ID
  kind: 'break'
  time: TimeString
  label: string
  durationMin?: number
}

export type RundownItem = SceneItem | BreakItem

export interface CastMember {
  id: ID
  number: number
  characterName: string
  actorName: string
  phone?: string
  email?: string
  photoAssetId?: ID
}

/** 演員在「某一天」的通告。沒有紀錄代表當天不出勤 */
export interface CastCall {
  working: boolean
  status: TalentStatus
  transpo: string
  callTime: TimeString
  blkRhs: TimeString
  muWard: TimeString
  onSet: TimeString
  remarks: string
}

export interface ExtraGroup {
  id: ID
  description: string
  count: number
  callTime: TimeString
  notes?: string
}

export interface Department {
  id: ID
  name: string
  color?: string
}

export interface CrewMember {
  id: ID
  departmentId: ID
  position: string
  name: string
  phone?: string
  email?: string
  photoAssetId?: ID
  notes?: string
}

/** 工作人員在「某一天」的通告。沒有紀錄代表出勤、沿用總通告時間 */
export interface CrewCall {
  working: boolean
  callTime: TimeString
}

/** 車輛：由所有天共用（車型、司機、車牌） */
export interface Vehicle {
  id: ID
  number: string
  type: VehicleType
  typeLabel?: string
  driverName: string
  driverPhone?: string
  plateNumber?: string
  /** 座位數（不含司機），用於超載提醒 */
  seats?: number
  notes?: string
}

/** 乘客在「某一台車」的上下車資訊 */
export interface PassengerDetail {
  boardTime: TimeString
  boardPlace: PlaceKind
  boardCustom: string
  alightPlace: PlaceKind
  alightCustom: string
  note: string
}

/** 車輛在「某一天」的車表行程。沒有紀錄或 running=false 代表本日不出車 */
export interface VehicleSchedule {
  running: boolean
  purpose: VehiclePurpose
  departureTime: TimeString
  pickupLocation: string
  transferTime: TimeString
  arrivalTime: TimeString
  returnTime: TimeString
  destination: PlaceKind
  destinationCustom: string
  passengerIds: ID[]
  passengerDetails: Record<ID, PassengerDetail>
  passengersNote: string
  landmarks: string
  parking: string
  unloadingZone: string
  notes: string
}

export interface DepartmentNote {
  id: ID
  departmentId: ID
  content: RichText
}

export interface Contact {
  id: ID
  label: string
  name: string
  phone?: string
  email?: string
}

export interface ImageAsset {
  id: ID
  mime: 'image/jpeg' | 'image/png' | 'image/webp'
  dataBase64: string
}

/** 單一拍攝日 */
export interface ShootDay {
  id: ID
  date: string
  crewCall: TimeString
  generalCallNote?: string
  setMedic: string
  scheduleVersion: string
  locations: LocationBlock
  weather: WeatherInfo
  rundown: RundownItem[]
  extras: ExtraGroup[]
  castCalls: Record<ID, CastCall>
  crewCalls: Record<ID, CrewCall>
  vehicleSchedules: Record<ID, VehicleSchedule>
  departmentNotes: DepartmentNote[]
  additionalCrewNotes: RichText
  quoteOfTheDay: string
}

export interface SchedDocument {
  formatVersion: number
  meta: DocumentMeta
  project: ProjectInfo
  safetyBanner: string[]
  cast: CastMember[]
  crew: CrewMember[]
  departments: Department[]
  vehicles: Vehicle[]
  usefulContacts: Contact[]
  assets: Record<ID, ImageAsset>
  days: ShootDay[]
}
