import type { CastMember, CrewMember, Department, SchedDocument, ShootDay, Vehicle } from '@shared/schema'
import { defaultCastCall, defaultCrewCall, defaultVehicleSchedule } from '@/lib/defaults'
import { omitKey, uid } from '@/lib/utils'
import type { ProjectState } from './types'

/** 從某一天的所有車表移除指定乘客 */
function stripPassenger(day: ShootDay, personId: string): ShootDay {
  return {
    ...day,
    vehicleSchedules: Object.fromEntries(
      Object.entries(day.vehicleSchedules).map(([vid, s]) => [
        vid,
        {
          ...s,
          passengerIds: s.passengerIds.filter((x) => x !== personId),
          passengerDetails: omitKey(s.passengerDetails, personId),
        },
      ]),
    ),
  }
}

export type SharedActions = Pick<
  ProjectState,
  | 'addCast'
  | 'addCasts'
  | 'updateCast'
  | 'removeCast'
  | 'setCastCall'
  | 'addCrew'
  | 'updateCrew'
  | 'removeCrew'
  | 'setCrewCall'
  | 'addDepartment'
  | 'renameDepartment'
  | 'removeDepartment'
  | 'addVehicle'
  | 'updateVehicle'
  | 'removeVehicle'
  | 'setVehicleSchedule'
  | 'addExtra'
  | 'updateExtra'
  | 'removeExtra'
  | 'addKeyPerson'
  | 'updateKeyPerson'
  | 'removeKeyPerson'
  | 'addContact'
  | 'updateContact'
  | 'removeContact'
  | 'setDepartmentNote'
  | 'addAsset'
>

export function createSharedActions(
  patch: (fn: (d: SchedDocument) => SchedDocument) => void,
  patchDay: (fn: (day: ShootDay) => ShootDay) => void,
): SharedActions {
  return {
    addCast: () =>
      patch((d) => {
        const m: CastMember = {
          id: uid(),
          number: d.cast.reduce((mx, c) => Math.max(mx, c.number), 0) + 1,
          characterName: '',
          actorName: '',
        }
        return { ...d, cast: [...d.cast, m] }
      }),
    addCasts: (items: Array<Partial<CastMember>>) =>
      patch((d) => {
        let maxNumber = d.cast.reduce((mx, c) => Math.max(mx, c.number), 0)
        const newCasts = items.map((item) => {
          maxNumber++
          return {
            id: uid(),
            number: maxNumber,
            characterName: item.characterName || '',
            actorName: item.actorName || '',
            phone: item.phone,
            email: item.email,
            photoAssetId: item.photoAssetId,
          }
        })
        return { ...d, cast: [...d.cast, ...newCasts] }
      }),
    updateCast: (id, p) =>
      patch((d) => ({ ...d, cast: d.cast.map((c) => (c.id === id ? { ...c, ...p } : c)) })),
    removeCast: (id) =>
      patch((d) => ({
        ...d,
        cast: d.cast.filter((c) => c.id !== id),
        days: d.days.map((day) =>
          stripPassenger(
            {
              ...day,
              castCalls: omitKey(day.castCalls, id),
              rundown: day.rundown.map((r) =>
                r.kind === 'scene' ? { ...r, castIds: r.castIds.filter((x) => x !== id) } : r,
              ),
            },
            id,
          ),
        ),
      })),
    setCastCall: (castId, p) =>
      patchDay((day) => ({
        ...day,
        castCalls: {
          ...day.castCalls,
          [castId]: { ...defaultCastCall(), ...day.castCalls[castId], ...p },
        },
      })),

    addCrew: (departmentId) =>
      patch((d) => {
        const m: CrewMember = { id: uid(), departmentId, position: '', name: '' }
        return { ...d, crew: [...d.crew, m] }
      }),
    updateCrew: (id, p) =>
      patch((d) => ({ ...d, crew: d.crew.map((c) => (c.id === id ? { ...c, ...p } : c)) })),
    removeCrew: (id) =>
      patch((d) => ({
        ...d,
        crew: d.crew.filter((c) => c.id !== id),
        days: d.days.map((day) => stripPassenger({ ...day, crewCalls: omitKey(day.crewCalls, id) }, id)),
      })),
    setCrewCall: (crewId, p) =>
      patchDay((day) => ({
        ...day,
        crewCalls: {
          ...day.crewCalls,
          [crewId]: { ...defaultCrewCall(), ...day.crewCalls[crewId], ...p },
        },
      })),

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
      patch((d) => {
        const gone = new Set(d.crew.filter((c) => c.departmentId === id).map((c) => c.id))
        return {
          ...d,
          departments: d.departments.filter((x) => x.id !== id),
          crew: d.crew.filter((c) => c.departmentId !== id),
          days: d.days.map((day) => {
            let next: ShootDay = {
              ...day,
              crewCalls: Object.fromEntries(Object.entries(day.crewCalls).filter(([k]) => !gone.has(k))),
              departmentNotes: day.departmentNotes.filter((n) => n.departmentId !== id),
            }
            for (const gid of gone) next = stripPassenger(next, gid)
            return next
          }),
        }
      }),

    addVehicle: () =>
      patch((d) => {
        const m: Vehicle = {
          id: uid(),
          number: String(d.vehicles.length + 1),
          type: 'talent',
          driverName: '',
        }
        return { ...d, vehicles: [...d.vehicles, m] }
      }),
    updateVehicle: (id, p) =>
      patch((d) => ({ ...d, vehicles: d.vehicles.map((v) => (v.id === id ? { ...v, ...p } : v)) })),
    removeVehicle: (id) =>
      patch((d) => ({
        ...d,
        vehicles: d.vehicles.filter((v) => v.id !== id),
        days: d.days.map((day) => ({ ...day, vehicleSchedules: omitKey(day.vehicleSchedules, id) })),
      })),
    setVehicleSchedule: (vehicleId, p) =>
      patchDay((day) => ({
        ...day,
        vehicleSchedules: {
          ...day.vehicleSchedules,
          [vehicleId]: { ...defaultVehicleSchedule(), ...day.vehicleSchedules[vehicleId], ...p },
        },
      })),

    addExtra: () =>
      patchDay((day) => ({
        ...day,
        extras: [...day.extras, { id: uid(), description: '', count: 1, callTime: '' }],
      })),
    updateExtra: (id, p) =>
      patchDay((day) => ({ ...day, extras: day.extras.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
    removeExtra: (id) =>
      patchDay((day) => ({ ...day, extras: day.extras.filter((x) => x.id !== id) })),

    addKeyPerson: () =>
      patch((d) => ({
        ...d,
        project: {
          ...d.project,
          keyPeople: [...d.project.keyPeople, { id: uid(), title: '', name: '' }],
        },
      })),
    updateKeyPerson: (id, p) =>
      patch((d) => ({
        ...d,
        project: {
          ...d.project,
          keyPeople: d.project.keyPeople.map((k) => (k.id === id ? { ...k, ...p } : k)),
        },
      })),
    removeKeyPerson: (id) =>
      patch((d) => ({
        ...d,
        project: { ...d.project, keyPeople: d.project.keyPeople.filter((k) => k.id !== id) },
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
      patchDay((day) => {
        const exists = day.departmentNotes.some((n) => n.departmentId === departmentId)
        return {
          ...day,
          departmentNotes: exists
            ? day.departmentNotes.map((n) => (n.departmentId === departmentId ? { ...n, content } : n))
            : [...day.departmentNotes, { id: uid(), departmentId, content }],
        }
      }),

    addAsset: (asset) => patch((d) => ({ ...d, assets: { ...d.assets, [asset.id]: asset } })),
  }
}
