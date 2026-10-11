import { create } from 'zustand'
import { arrayMove } from '@dnd-kit/sortable'
import type {
  BreakItem,
  CastMember,
  Contact,
  CrewMember,
  Department,
  DepartmentNote,
  ExtraGroup,
  ImageAsset,
  KeyPerson,
  RundownItem,
  SceneItem,
  SchedDocument,
} from '@shared/schema'
import { createEmptyDocument } from '@/lib/defaults'
import { emptyRich, uid } from '@/lib/utils'

export type ViewKey = 'general' | 'rundown' | 'cast' | 'crew' | 'notes' | 'preview'

interface SchedState {
  doc: SchedDocument
  filePath: string | null
  dirty: boolean
  view: ViewKey
  toast: { kind: 'info' | 'error'; text: string } | null

  setView: (v: ViewKey) => void
  showToast: (kind: 'info' | 'error', text: string) => void
  clearToast: () => void
  loadDocument: (doc: SchedDocument, filePath: string | null) => void
  markSaved: (filePath: string) => void
  patch: (fn: (d: SchedDocument) => SchedDocument) => void

  addScene: () => void
  addBreak: () => void
  updateRundownItem: (id: string, p: Partial<SceneItem> | Partial<BreakItem>) => void
  removeRundownItem: (id: string) => void
  moveRundownItem: (from: number, to: number) => void

  addCast: () => void
  updateCast: (id: string, p: Partial<CastMember>) => void
  removeCast: (id: string) => void
  moveCast: (from: number, to: number) => void

  addCrew: (departmentId: string) => void
  updateCrew: (id: string, p: Partial<CrewMember>) => void
  removeCrew: (id: string) => void
  addDepartment: (name: string) => void
  renameDepartment: (id: string, name: string) => void
  removeDepartment: (id: string) => void

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

export const useSchedStore = create<SchedState>((set, get) => {
  const patch = (fn: (d: SchedDocument) => SchedDocument) =>
    set((s) => {
      const next = fn(s.doc)
      return {
        doc: { ...next, meta: { ...next.meta, updatedAt: new Date().toISOString() } },
        dirty: true,
      }
    })

  return {
    doc: createEmptyDocument(),
    filePath: null,
    dirty: false,
    view: 'general',
    toast: null,

    setView: (view) => set({ view }),
    showToast: (kind, text) => set({ toast: { kind, text } }),
    clearToast: () => set({ toast: null }),
    loadDocument: (doc, filePath) => set({ doc, filePath, dirty: false }),
    markSaved: (filePath) => set({ filePath, dirty: false }),
    patch,

    addScene: () =>
      patch((d) => {
        const last = [...d.rundown].reverse().find((r) => r.kind === 'scene') as SceneItem | undefined
        const item: SceneItem = {
          id: uid(),
          kind: 'scene',
          time: '',
          sceneNumber: String(d.rundown.filter((r) => r.kind === 'scene').length + 1),
          intExt: last?.intExt ?? 'INT',
          dayNight: last?.dayNight ?? 'D',
          setName: '',
          description: emptyRich(),
          castIds: [],
          extrasNote: '',
          pages: '',
          location: last?.location ?? '',
        }
        return { ...d, rundown: [...d.rundown, item] }
      }),
    addBreak: () =>
      patch((d) => {
        const item: BreakItem = { id: uid(), kind: 'break', time: '', label: '午餐', durationMin: 60 }
        return { ...d, rundown: [...d.rundown, item] }
      }),
    updateRundownItem: (id, p) =>
      patch((d) => ({
        ...d,
        rundown: d.rundown.map((r) => (r.id === id ? ({ ...r, ...p } as RundownItem) : r)),
      })),
    removeRundownItem: (id) =>
      patch((d) => ({ ...d, rundown: d.rundown.filter((r) => r.id !== id) })),
    moveRundownItem: (from, to) =>
      patch((d) => ({ ...d, rundown: arrayMove(d.rundown, from, to) })),

    addCast: () =>
      patch((d) => {
        const m: CastMember = {
          id: uid(),
          number: d.cast.reduce((mx, c) => Math.max(mx, c.number), 0) + 1,
          characterName: '',
          actorName: '',
          status: '-',
          transpo: '',
          callTime: '',
          blkRhs: '',
          muWard: '',
          onSet: '',
          remarks: '',
        }
        return { ...d, cast: [...d.cast, m] }
      }),
    updateCast: (id, p) =>
      patch((d) => ({ ...d, cast: d.cast.map((c) => (c.id === id ? { ...c, ...p } : c)) })),
    removeCast: (id) =>
      patch((d) => ({
        ...d,
        cast: d.cast.filter((c) => c.id !== id),
        rundown: d.rundown.map((r) =>
          r.kind === 'scene' ? { ...r, castIds: r.castIds.filter((x) => x !== id) } : r,
        ),
      })),
    moveCast: (from, to) => patch((d) => ({ ...d, cast: arrayMove(d.cast, from, to) })),

    addCrew: (departmentId) =>
      patch((d) => {
        const m: CrewMember = { id: uid(), departmentId, position: '', name: '', callTime: '' }
        return { ...d, crew: [...d.crew, m] }
      }),
    updateCrew: (id, p) =>
      patch((d) => ({ ...d, crew: d.crew.map((c) => (c.id === id ? { ...c, ...p } : c)) })),
    removeCrew: (id) => patch((d) => ({ ...d, crew: d.crew.filter((c) => c.id !== id) })),

    addDepartment: (name) =>
      patch((d) => {
        const dep: Department = { id: uid(), name }
        return { ...d, departments: [...d.departments, dep] }
      }),
    renameDepartment: (id, name) =>
      patch((d) => ({
        ...d,
        departments: d.departments.map((x) => (x.id === id ? { ...x, name } : x)),
      })),
    removeDepartment: (id) =>
      patch((d) => ({
        ...d,
        departments: d.departments.filter((x) => x.id !== id),
        crew: d.crew.filter((c) => c.departmentId !== id),
        departmentNotes: d.departmentNotes.filter((n) => n.departmentId !== id),
      })),

    addExtra: () =>
      patch((d) => ({
        ...d,
        extras: [...d.extras, { id: uid(), description: '', count: 1, callTime: '' }],
      })),
    updateExtra: (id, p) =>
      patch((d) => ({ ...d, extras: d.extras.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
    removeExtra: (id) => patch((d) => ({ ...d, extras: d.extras.filter((x) => x.id !== id) })),

    addKeyPerson: () =>
      patch((d) => ({
        ...d,
        general: {
          ...d.general,
          keyPeople: [...d.general.keyPeople, { id: uid(), title: '', name: '' }],
        },
      })),
    updateKeyPerson: (id, p) =>
      patch((d) => ({
        ...d,
        general: {
          ...d.general,
          keyPeople: d.general.keyPeople.map((k) => (k.id === id ? { ...k, ...p } : k)),
        },
      })),
    removeKeyPerson: (id) =>
      patch((d) => ({
        ...d,
        general: { ...d.general, keyPeople: d.general.keyPeople.filter((k) => k.id !== id) },
      })),

    addContact: () =>
      patch((d) => ({
        ...d,
        usefulContacts: [...d.usefulContacts, { id: uid(), label: '', name: '' }],
      })),
    updateContact: (id, p) =>
      patch((d) => ({
        ...d,
        usefulContacts: d.usefulContacts.map((c) => (c.id === id ? { ...c, ...p } : c)),
      })),
    removeContact: (id) =>
      patch((d) => ({ ...d, usefulContacts: d.usefulContacts.filter((c) => c.id !== id) })),

    setDepartmentNote: (departmentId, content) =>
      patch((d) => {
        const exists = d.departmentNotes.some((n) => n.departmentId === departmentId)
        return {
          ...d,
          departmentNotes: exists
            ? d.departmentNotes.map((n) => (n.departmentId === departmentId ? { ...n, content } : n))
            : [...d.departmentNotes, { id: uid(), departmentId, content }],
        }
      }),

    addAsset: (asset) => {
      get().patch((d) => ({ ...d, assets: { ...d.assets, [asset.id]: asset } }))
    },
  }
})
