import { create } from 'zustand'
import type { SchedDocument, ShootDay } from '@shared/schema'
import { createEmptyDocument } from '@/lib/defaults'
import { createDayActions, selectCurrentDay } from './dayActions'
import { createSharedActions } from './sharedActions'
import type { ProjectState } from './types'

export type { ViewKey, PrintScope } from './types'
export { selectCurrentDay }

const touch = (d: SchedDocument): SchedDocument => ({
  ...d,
  meta: { ...d.meta, updatedAt: new Date().toISOString() },
})

export const useProjectStore = create<ProjectState>((set, get) => {
  const patch = (fn: (d: SchedDocument) => SchedDocument) =>
    set((s) => ({ doc: touch(fn(s.doc)), dirty: true }))

  const patchDay = (fn: (day: ShootDay) => ShootDay) =>
    patch((doc) => {
      const target = selectCurrentDay({ doc, currentDayId: get().currentDayId })
      return { ...doc, days: doc.days.map((x) => (x.id === target.id ? fn(x) : x)) }
    })

  const initial = createEmptyDocument()

  return {
    doc: initial,
    currentDayId: initial.days[0].id,
    loadCount: 0,
    filePath: null,
    dirty: false,
    view: 'project',
    printScope: 'day',
    toast: null,

    setView: (view) => set({ view }),
    setPrintScope: (printScope) => set({ printScope }),
    showToast: (kind, text) => set({ toast: { kind, text } }),
    clearToast: () => set({ toast: null }),
    setCurrentDay: (id) => set({ currentDayId: id }),
    loadDocument: (doc, filePath) =>
      set((s) => ({
        doc,
        filePath,
        dirty: false,
        currentDayId: doc.days[0].id,
        loadCount: s.loadCount + 1,
      })),
    markSaved: (filePath) => set({ filePath, dirty: false }),
    patch,
    patchDay,

    ...createDayActions(set, get, patch, patchDay),
    ...createSharedActions(patch, patchDay),
  }
})

/** 目前選取的拍攝日（用於 selector） */
export const useCurrentDay = (): ShootDay => useProjectStore(selectCurrentDay)
