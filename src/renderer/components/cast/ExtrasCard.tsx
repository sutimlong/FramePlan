import { Plus, Trash2 } from 'lucide-react'
import { useCurrentDay, useProjectStore } from '@/store/useProjectStore'
import { Card, TextField, TimeField } from '../common/Fields'

export function ExtrasCard() {
  const extras = useCurrentDay().extras
  const st = useProjectStore.getState

  return (
    <Card
      title="本日臨演／替身 (Extras / Standins)"
      actions={
        <button className="btn small" onClick={() => st().addExtra()}>
          <Plus size={14} /> 新增
        </button>
      }
    >
      {extras.length === 0 && <p className="muted">本日無臨演或替身</p>}
      {extras.map((x) => (
        <div className="row-inline" key={x.id}>
          <TextField placeholder="說明（例如：路人、替身）" value={x.description} onChange={(v) => st().updateExtra(x.id, { description: v })} />
          <label className="field compact">
            <span className="field-label">人數</span>
            <input type="number" min={0} value={x.count} onChange={(e) => st().updateExtra(x.id, { count: Number(e.target.value) })} />
          </label>
          <TimeField compact label="Call" value={x.callTime} onChange={(v) => st().updateExtra(x.id, { callTime: v })} />
          <TextField placeholder="備註" value={x.notes ?? ''} onChange={(v) => st().updateExtra(x.id, { notes: v })} />
          <button className="icon-btn danger" onClick={() => st().removeExtra(x.id)} aria-label="刪除">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </Card>
  )
}
