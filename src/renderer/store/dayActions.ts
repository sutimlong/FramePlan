import { arrayMove } from '@dnd-kit/sortable'
import type { BreakItem, RundownItem, SceneItem, SchedDocument, ShootDay } from '@shared/schema'
import { cloneDay, createEmptyDay, defaultCastCall } from '@/lib/defaults'
import { addDaysIso, emptyRich, uid } from '@/lib/utils'
import type { GetState, ProjectState, SetState } from './types'

export const selectCurrentDay = (s: Pick<ProjectState, 'doc' | 'currentDayId'>): ShootDay =>
  s.doc.days.find((d) => d.id === s.currentDayId) ?? s.doc.days[0]

export type DayActions = Pick<
  ProjectState,
  | 'setProject'
  | 'setDay'
  | 'addDay'
  | 'removeDay'
  | 'sortDays'
  | 'addScene'
  | 'addBreak'
  | 'updateRundownItem'
  | 'removeRundownItem'
  | 'moveRundownItem'
>

export function createDayActions(
  set: SetState,
  get: GetState,
  patch: (fn: (d: SchedDocument) => SchedDocument) => void,
  patchDay: (fn: (day: ShootDay) => ShootDay) => void,
): DayActions {
  return {
    setProject: (p) => patch((d) => ({ ...d, project: { ...d.project, ...p } })),
    setDay: (p) => patchDay((day) => ({ ...day, ...p })),

    addDay: (mode) => {
      const s = get()
      const cur = selectCurrentDay(s)
      const last = s.doc.days[s.doc.days.length - 1]
      const date = addDaysIso(last.date || cur.date, 1)
      const day: ShootDay =
        mode === 'copy' ? cloneDay(cur, date) : { ...createEmptyDay(date), crewCall: cur.crewCall }
      patch((d) => ({ ...d, days: [...d.days, day] }))
      set({ currentDayId: day.id })
    },
    removeDay: (id) => {
      const s = get()
      if (s.doc.days.length <= 1) return
      const idx = s.doc.days.findIndex((d) => d.id === id)
      if (idx < 0) return
      const next = s.doc.days[idx === 0 ? 1 : idx - 1]
      patch((d) => ({ ...d, days: d.days.filter((x) => x.id !== id) }))
      if (s.currentDayId === id) set({ currentDayId: next.id })
    },
    sortDays: () =>
      patch((d) => ({ ...d, days: [...d.days].sort((a, b) => a.date.localeCompare(b.date)) })),

    addScene: () =>
      patchDay((day) => {
        const scenes = day.rundown.filter((r): r is SceneItem => r.kind === 'scene')
        const last = scenes[scenes.length - 1]
        const item: SceneItem = {
          id: uid(),
          kind: 'scene',
          time: '',
          sceneNumber: String(scenes.length + 1),
          shotNumber: '',
          cameraMovement: '',
          intExt: last?.intExt ?? 'INT',
          dayNight: last?.dayNight ?? 'D',
          setName: '',
          description: emptyRich(),
          castIds: [],
          extrasNote: '',
          location: last?.location ?? '',
          remark: '',
          storyboardAssetIds: [],
        }
        return { ...day, rundown: [...day.rundown, item] }
      }),
    addBreak: () =>
      patchDay((day) => {
        const item: BreakItem = { id: uid(), kind: 'break', time: '', label: '午餐', durationMin: 60 }
        return { ...day, rundown: [...day.rundown, item] }
      }),
    updateRundownItem: (id, p) =>
      patchDay((day) => {
        const prev = day.rundown.find((r) => r.id === id)
        let castCalls = day.castCalls
        // 把演員加進場次時，自動標記該演員本日出勤
        if (prev?.kind === 'scene' && 'castIds' in p && p.castIds) {
          for (const cid of p.castIds.filter((x) => !prev.castIds.includes(x))) {
            const cur = castCalls[cid] ?? defaultCastCall()
            if (!cur.working) castCalls = { ...castCalls, [cid]: { ...cur, working: true } }
          }
        }
        return {
          ...day,
          castCalls,
          rundown: day.rundown.map((r) => (r.id === id ? ({ ...r, ...p } as RundownItem) : r)),
        }
      }),
    removeRundownItem: (id) =>
      patchDay((day) => ({ ...day, rundown: day.rundown.filter((r) => r.id !== id) })),
    moveRundownItem: (from, to) =>
      patchDay((day) => ({ ...day, rundown: arrayMove(day.rundown, from, to) })),
  }
}
