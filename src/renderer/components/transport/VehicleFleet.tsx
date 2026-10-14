import { Plus, Trash2 } from 'lucide-react'
import { confirmAction } from '@/lib/confirm'
import { useProjectStore } from '@/store/useProjectStore'
import { Card, NumberField, SelectField, TextField } from '../common/Fields'
import { VEHICLE_TYPE_OPTIONS } from './transportOptions'

/** 車隊名單：所有天共用 */
export function VehicleFleet() {
  const vehicles = useProjectStore((s) => s.doc.vehicles)
  const st = useProjectStore.getState

  return (
    <Card
      title="車隊名單（所有天共用）"
      actions={
        <button className="btn small primary" onClick={() => st().addVehicle()}>
          <Plus size={14} /> 新增車輛
        </button>
      }
    >
      {vehicles.length === 0 && <p className="muted">尚未新增車輛。</p>}
      {vehicles.map((v) => (
        <div className="row-inline" key={v.id}>
          <TextField label="車號" className="w-sm" value={v.number} onChange={(x) => st().updateVehicle(v.id, { number: x })} />
          <SelectField label="車型" value={v.type} options={VEHICLE_TYPE_OPTIONS} onChange={(x) => st().updateVehicle(v.id, { type: x })} />
          {v.type === 'custom' && (
            <TextField label="自訂車型" value={v.typeLabel ?? ''} onChange={(x) => st().updateVehicle(v.id, { typeLabel: x })} />
          )}
          <NumberField label="座位數" min={1} value={v.seats ?? null} onChange={(x) => st().updateVehicle(v.id, { seats: x ?? undefined })} />
          <TextField label="司機姓名" value={v.driverName} onChange={(x) => st().updateVehicle(v.id, { driverName: x })} />
          <TextField label="司機手機" value={v.driverPhone ?? ''} onChange={(x) => st().updateVehicle(v.id, { driverPhone: x })} />
          <TextField label="車牌號碼" value={v.plateNumber ?? ''} onChange={(x) => st().updateVehicle(v.id, { plateNumber: x })} />
          <TextField label="備註" value={v.notes ?? ''} onChange={(x) => st().updateVehicle(v.id, { notes: x })} />
          <button
            className="icon-btn danger"
            title="刪除車輛（所有天的車表一併移除）"
            onClick={async () => {
              const ok = await confirmAction({
                message: `刪除「${v.number || '未編號'}」？`,
                detail: '所有天的車表都會一起移除。',
                confirmLabel: '刪除',
                danger: true,
              })
              if (ok) st().removeVehicle(v.id)
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </Card>
  )
}
