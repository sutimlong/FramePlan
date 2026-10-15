import type {
  BreakItem,
  CastCall,
  CastMember,
  Contact,
  CrewCall,
  CrewMember,
  DepartmentNote,
  ExtraGroup,
  ImageAsset,
  KeyPerson,
  ProjectInfo,
  SceneItem,
  SchedDocument,
  ShootDay,
  Vehicle,
  VehicleSchedule,
} from '@shared/schema'

export type ViewKey = 'project' | 'day' | 'rundown' | 'cast' | 'crew' | 'transport' | 'notes' | 'preview'
export type PrintScope = 'day' | 'all'

export interface ProjectState {
  doc: SchedDocument
  currentDayId: string
  /** 每次載入檔案 +1，用來強制重新掛載畫面（Slate 編輯器才會載入新內容） */
  loadCount: number
  filePath: string | null
  dirty: boolean
  view: ViewKey
  printScope: PrintScope
  toast: { kind: 'info' | 'error'; text: string } | null
  /** 匯出 PDF 時自動產生的分享 QR code（data URL）；null 表示不顯示 QR 尾頁 */
  shareQr: string | null

  setView: (v: ViewKey) => void
  setPrintScope: (s: PrintScope) => void
  setShareQr: (dataUrl: string | null) => void
  showToast: (kind: 'info' | 'error', text: string) => void
  clearToast: () => void
  setCurrentDay: (id: string) => void
  loadDocument: (doc: SchedDocument, filePath: string | null) => void
  markSaved: (filePath: string) => void
  patch: (fn: (d: SchedDocument) => SchedDocument) => void
  patchDay: (fn: (day: ShootDay) => ShootDay) => void

  setProject: (p: Partial<ProjectInfo>) => void
  setDay: (p: Partial<ShootDay>) => void
  addDay: (mode: 'blank' | 'copy') => void
  removeDay: (id: string) => void
  sortDays: () => void

  addScene: () => void
  addBreak: () => void
  updateRundownItem: (id: string, p: Partial<SceneItem> | Partial<BreakItem>) => void
  removeRundownItem: (id: string) => void
  moveRundownItem: (from: number, to: number) => void

  addCast: () => void
  addCasts: (items: Array<Partial<CastMember>>) => void
  updateCast: (id: string, p: Partial<CastMember>) => void
  removeCast: (id: string) => void
  setCastCall: (castId: string, p: Partial<CastCall>) => void

  addCrew: (departmentId: string) => void
  updateCrew: (id: string, p: Partial<CrewMember>) => void
  removeCrew: (id: string) => void
  setCrewCall: (crewId: string, p: Partial<CrewCall>) => void
  addDepartment: (name: string) => void
  renameDepartment: (id: string, name: string) => void
  removeDepartment: (id: string) => void

  addVehicle: () => void
  updateVehicle: (id: string, p: Partial<Vehicle>) => void
  removeVehicle: (id: string) => void
  setVehicleSchedule: (vehicleId: string, p: Partial<VehicleSchedule>) => void

  addExtra: () => void
  updateExtra: (id: string, p: Partial<ExtraGroup>) => void
  removeExtra: (id: string) => void
  addKeyPerson: () => void
  updateKeyPerson: (id: string, p: Partial<KeyPerson>) => void
  removeKeyPerson: (id: string) => void
  addContact: () => void
  updateContact: (id: string, p: Partial<Contact>) => void
  removeContact: (id: string) => void
  setDepartmentNote: (departmentId: string, content: DepartmentNote['content']) => void
  addAsset: (asset: ImageAsset) => void
}

export type SetState = (
  partial: Partial<ProjectState> | ((s: ProjectState) => Partial<ProjectState>),
) => void
export type GetState = () => ProjectState
