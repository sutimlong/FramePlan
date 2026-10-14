import { CopyPlus, TriangleAlert } from 'lucide-react'
import { confirmAction } from '@/lib/confirm'
import { defaultVehicleSchedule } from '@/lib/defaults'
import { checkTransport, listPeople } from '@/lib/transport'
import { useCurrentDay, useProjectStore } from '@/store/useProjectStore'
import { Card } from '../common/Fields'
import { VehicleDayCard } from './VehicleDayCard'
import { VehicleFleet } from './VehicleFleet'

export function TransportView() {
  const doc = useProjectStore((s) => s.doc)
  const day = useCurrentDay()
  const st = useProjectStore.getState
  const vehicles = doc.vehicles

  const people = listPeople(doc, day)
  const issues = checkTransport(doc, day)
  const dayIndex = doc.days.findIndex((d) => d.id === day.id)
  const prevDay = dayIndex > 0 ? doc.days[dayIndex - 1] : undefined
  const runningCount = vehicles.filter((v) => day.vehicleSchedules[v.id]?.running).length

  const copyFromPrev = async () => {
    if (!prevDay) return
    if (runningCount > 0) {
      const ok = await confirmAction({
        message: '這會覆蓋本日已有的車表安排，確定從前一天複製？',
        confirmLabel: '複製',
        danger: true,
      })
      if (!ok) return
    }
    for (const v of vehicles) {
      const src = prevDay.vehicleSchedules[v.id]
      st().setVehicleSchedule(v.id, src ? structuredClone(src) : defaultVehicleSchedule())
    }
  }

  return (
    <div className="view-grid">
      <p className="hint">
        車輛、車型與司機資料由所有天共用；每台車「本日是否出車、行程、乘車名單與上下車安排」只影響目前這一天，並會同步到通告表第二頁「工作人員通告」下方的「車表安排」。
        集合地點、目的地與乘客上下車地點皆可自由填寫文字，會原樣列印到通告表（例如「玉成飯店大廳」「陽明山基地營」）。
      </p>

      <VehicleFleet />

      <Card
        title={`本日車表安排（出車 ${runningCount} / ${vehicles.length} 台）`}
        actions={
          <button className="btn small" disabled={!prevDay || vehicles.length === 0} onClick={copyFromPrev} title="把前一天的出車與乘客安排複製到本日">
            <CopyPlus size={14} /> 複製前一天
          </button>
        }
      >
        {vehicles.length === 0 && <p className="muted">請先在上方新增車輛。</p>}

        {issues.length > 0 && (
          <div className="transport-issues">
            <TriangleAlert size={14} />
            <ul>
              {issues.map((i, n) => (
                <li key={n}>{i.message}</li>
              ))}
            </ul>
          </div>
        )}

        {vehicles.map((v) => (
          <VehicleDayCard key={v.id} vehicle={v} people={people} />
        ))}
      </Card>
    </div>
  )
}

