import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import type { PassengerDetail, Vehicle, VehicleSchedule } from '@shared/schema'
import { defaultPassengerDetail } from '@/lib/defaults'
import type { Person } from '@/lib/transport'
import { useProjectStore } from '@/store/useProjectStore'
import { TextField } from '../common/Fields'
import { PassengerRow } from './PassengerRow'
import type { PersonFilter } from './transportOptions'

interface Props {
  vehicle: Vehicle
  sched: VehicleSchedule
  people: Person[]
  seatInfo: string
}

/** 乘車名單：可篩選演員／工作人員、一鍵加入出勤者，逐人設定上下車 */
export function PassengerList({ vehicle: v, sched, people, seatInfo }: Props) {
  const st = useProjectStore.getState
  const [filter, setFilter] = useState<PersonFilter>('all')
  const [pickerOpen, setPickerOpen] = useState(false)

  const set = (p: Partial<VehicleSchedule>) => st().setVehicleSchedule(v.id, p)
  const peopleById = new Map(people.map((p) => [p.id, p]))
  const detailOf = (pid: string): PassengerDetail => ({ ...defaultPassengerDetail(), ...sched.passengerDetails[pid] })
  const setDetail = (pid: string, p: Partial<PassengerDetail>) =>
    set({ passengerDetails: { ...sched.passengerDetails, [pid]: { ...detailOf(pid), ...p } } })

  /** 一次加入多位乘客，預設帶入出發時間、集合地點與目的地 */
  const addPassengers = (ids: string[]) => {
    const fresh = ids.filter((id) => !sched.passengerIds.includes(id))
    if (fresh.length === 0) return
    const details = { ...sched.passengerDetails }
    for (const id of fresh) {
      details[id] = {
        ...defaultPassengerDetail(),
        boardTime: sched.departureTime,
        boardPlace: sched.pickupLocation.trim() ? 'pickup' : '',
        alightPlace: sched.destination,
        alightCustom: sched.destination === 'custom' ? sched.destinationCustom : '',
      }
    }
    set({ passengerIds: [...sched.passengerIds, ...fresh], passengerDetails: details })
  }
  const removePassenger = (pid: string) => {
    const rest = { ...sched.passengerDetails }
    delete rest[pid]
    set({ passengerIds: sched.passengerIds.filter((x) => x !== pid), passengerDetails: rest })
  }

  const available = people.filter((p) => (filter === 'all' || p.kind === filter) && !sched.passengerIds.includes(p.id))

  return (
    <div className="passenger-box">
      <div className="passenger-head">
        <span className="field-label">乘車名單（{seatInfo}）</span>
        <div className="passenger-tools">
          <select value={filter} onChange={(e) => setFilter(e.target.value as PersonFilter)} aria-label="人員篩選">
            <option value="all">全部人員</option>
            <option value="cast">僅演員</option>
            <option value="crew">僅工作人員</option>
          </select>
          <button className="btn small" onClick={() => setPickerOpen((o) => !o)}>
            <UserPlus size={14} /> 加入乘客
          </button>
        </div>
      </div>

      {pickerOpen && (
        <div className="cast-chips">
          {people.length === 0 && <span className="muted">請先於「演員／工作人員」頁新增人員</span>}
          {available.length > 0 && (
            <>
              <button type="button" className="chip" onClick={() => addPassengers(available.filter((p) => p.working).map((p) => p.id))}>
                + 全部出勤者
              </button>
              <button type="button" className="chip" onClick={() => addPassengers(available.map((p) => p.id))}>
                + 全選
              </button>
            </>
          )}
          {available.map((p) => (
            <button key={p.id} type="button" className={`chip ${p.working ? '' : 'dim'}`} onClick={() => addPassengers([p.id])} title={p.sub}>
              {p.kind === 'cast' ? '演員' : '工作'}・{p.name}
              {!p.working && '（不出勤）'}
            </button>
          ))}
          {people.length > 0 && available.length === 0 && <span className="muted">此分類人員都已在乘車名單</span>}
        </div>
      )}

      {sched.passengerIds.length === 0 ? (
        <p className="muted">尚未加入乘客</p>
      ) : (
        <div className="passenger-list">
          {sched.passengerIds.map((pid, idx) => {
            const p = peopleById.get(pid)
            if (!p) return null
            return (
              <PassengerRow key={pid} index={idx} person={p} detail={detailOf(pid)} onChange={(x) => setDetail(pid, x)} onRemove={() => removePassenger(pid)} />
            )
          })}
        </div>
      )}
      <TextField label="乘車備註" value={sched.passengersNote} onChange={(x) => set({ passengersNote: x })} />
    </div>
  )
}
