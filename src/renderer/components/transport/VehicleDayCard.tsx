import type { Vehicle, VehicleSchedule } from '@shared/schema'
import { defaultVehicleSchedule } from '@/lib/defaults'
import { resolvePlace, vehicleTypeName, type Person } from '@/lib/transport'
import { useCurrentDay, useProjectStore } from '@/store/useProjectStore'
import { SelectField, TextField, TimeField } from '../common/Fields'
import { PassengerList } from './PassengerList'
import { PLACE_OPTIONS, PURPOSE_OPTIONS } from './transportOptions'

/** 單一車輛在「目前這一天」的車表：是否出車、行程、乘客 */
export function VehicleDayCard({ vehicle: v, people }: { vehicle: Vehicle; people: Person[] }) {
  const day = useCurrentDay()
  const st = useProjectStore.getState

  const sched: VehicleSchedule = day.vehicleSchedules[v.id] ?? defaultVehicleSchedule()
  const set = (p: Partial<VehicleSchedule>) => st().setVehicleSchedule(v.id, p)
  const seatInfo = v.seats ? `${sched.passengerIds.length} / ${v.seats} 座` : `${sched.passengerIds.length} 人`
  const over = !!v.seats && sched.passengerIds.length > v.seats

  return (
    <div className={`person-card ${sched.running ? '' : 'off'}`}>
      <div className="vehicle-head">
        <label className="check">
          <input type="checkbox" checked={sched.running} onChange={(e) => set({ running: e.target.checked })} />
          <span className="badge">{v.number || '—'}</span>
          <strong>{vehicleTypeName(v)}</strong>
        </label>
        {v.driverName && <span className="muted">司機：{v.driverName}</span>}
        {v.plateNumber && <span className="muted">車牌 {v.plateNumber}</span>}
        {v.driverPhone && <span className="muted">{v.driverPhone}</span>}
        {sched.running ? <span className={`seat-pill ${over ? 'over' : ''}`}>{seatInfo}</span> : <span className="muted">本日不出車</span>}
      </div>

      {sched.running && (
        <>
          <div className="grid g3">
            <SelectField label="出車任務" value={sched.purpose} options={PURPOSE_OPTIONS} onChange={(x) => set({ purpose: x })} />
            <TimeField label="出發時間" value={sched.departureTime} onChange={(x) => set({ departureTime: x })} />
            <TimeField label="預定抵達下一個拍攝現場" value={sched.arrivalTime} onChange={(x) => set({ arrivalTime: x })} />
            <TextField label="集合地點（早餐點／飯店）" value={sched.pickupLocation} onChange={(x) => set({ pickupLocation: x })} />
            <SelectField label="目的地" value={sched.destination} options={PLACE_OPTIONS} onChange={(x) => set({ destination: x })} />
            {sched.destination === 'custom' ? (
              <TextField label="自訂目的地" value={sched.destinationCustom} onChange={(x) => set({ destinationCustom: x })} />
            ) : (
              <span />
            )}
            <TimeField label="轉場時間" value={sched.transferTime} onChange={(x) => set({ transferTime: x })} />
            <TimeField label="預計返程／收車" value={sched.returnTime} onChange={(x) => set({ returnTime: x })} />
          </div>
          {sched.destination && sched.destination !== 'custom' && (
            <p className="muted">目的地：{resolvePlace(sched.destination, '', day, sched)}（取自本日通告表的地點）</p>
          )}

          <PassengerList vehicle={v} sched={sched} people={people} seatInfo={seatInfo} />

          <div className="grid g2">
            <TextField label="重要地標" value={sched.landmarks} onChange={(x) => set({ landmarks: x })} />
            <TextField label="停車資訊" value={sched.parking} onChange={(x) => set({ parking: x })} />
            <TextField label="卸貨區位置" value={sched.unloadingZone} onChange={(x) => set({ unloadingZone: x })} />
            <TextField label="備註" value={sched.notes} onChange={(x) => set({ notes: x })} />
          </div>
        </>
      )}
    </div>
  )
}
