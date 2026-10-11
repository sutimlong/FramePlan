import { PLACE_KIND_LABELS, VEHICLE_PURPOSE_LABELS } from '@shared/schema'
import { listPeople, resolvePlace, runningVehicles, vehicleTypeName } from '@/lib/transport'
import { Section, dash } from './DayParts'
import type { DayCtx } from './DayParts'

/** 通告表第二頁「車表安排」：只列出本日有出車的車輛；全部不出車則整區隱藏 */
export function DayTransport({ doc, day }: DayCtx) {
  const vehicles = runningVehicles(doc, day)
  if (vehicles.length === 0) return null
  const people = new Map(listPeople(doc, day).map((p) => [p.id, p]))

  return (
    <Section title="車表安排 Transportation">
      <div className="cs-vehicles">
        {vehicles.map((v) => {
          const s = day.vehicleSchedules[v.id]
          const dest = resolvePlace(s.destination, s.destinationCustom, day, s)
          const route = [s.pickupLocation.trim(), dest].filter(Boolean).join(' → ')
          const meta: Array<[string, string]> = [
            ['出發', s.departureTime],
            ['轉場', s.transferTime],
            ['預定抵達', s.arrivalTime],
            ['返程', s.returnTime],
          ]
          const extra: Array<[string, string]> = [
            ['地標', s.landmarks],
            ['停車', s.parking],
            ['卸貨區', s.unloadingZone],
            ['備註', s.notes],
          ]
          const shown = extra.filter(([, t]) => t.trim())
          return (
            <div className="cs-vehicle" key={v.id}>
              <div className="cs-vehicle-head">
                <b>
                  {v.number || '—'} {vehicleTypeName(v)}
                </b>
                {s.purpose && <span>【{VEHICLE_PURPOSE_LABELS[s.purpose]}】</span>}
                <span>
                  司機 {dash(v.driverName)} {v.driverPhone ?? ''} {v.plateNumber ? `／${v.plateNumber}` : ''}
                </span>
                <span className="cs-times">
                  {meta.filter(([, t]) => t).map(([k, t]) => `${k} ${t}`).join('　') || '時間未定'}
                </span>
              </div>
              {route && <p className="cs-route">路線：{route}</p>}
              <table className="cs-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>乘客</th>
                    <th>類別</th>
                    <th>上車</th>
                    <th>上車地點</th>
                    <th>下車地點</th>
                    <th>備註</th>
                  </tr>
                </thead>
                <tbody>
                  {s.passengerIds.length === 0 && (
                    <tr>
                      <td colSpan={7} className="center it">
                        未指定乘客
                      </td>
                    </tr>
                  )}
                  {s.passengerIds.map((pid, i) => {
                    const p = people.get(pid)
                    if (!p) return null
                    const d = s.passengerDetails[pid]
                    const place = (k: string | undefined, custom: string | undefined) =>
                      k === 'custom' ? dash(custom) : k ? PLACE_KIND_LABELS[k as keyof typeof PLACE_KIND_LABELS].replace(/（.*）/, '') : '-'
                    return (
                      <tr key={pid}>
                        <td className="center">{i + 1}</td>
                        <td>{p.name}</td>
                        <td className="center">{p.kind === 'cast' ? '演員' : '工作人員'}</td>
                        <td className="center">{dash(d?.boardTime)}</td>
                        <td>{place(d?.boardPlace, d?.boardCustom)}</td>
                        <td>{place(d?.alightPlace, d?.alightCustom)}</td>
                        <td>{dash(d?.note)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {s.passengersNote.trim() && <p className="cs-vnote">乘車備註：{s.passengersNote}</p>}
              {shown.length > 0 && (
                <p className="cs-vnote">{shown.map(([k, t]) => `${k}：${t}`).join('　')}</p>
              )}
            </div>
          )
        })}
      </div>
    </Section>
  )
}
