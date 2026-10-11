import { Plus, Trash2 } from 'lucide-react'
import { TALENT_STATUS_LABELS, type TalentStatus } from '@shared/schema'
import { useSchedStore } from '@/store/useSchedStore'
import { Card, SelectField, TextField, TimeField } from '../common/Fields'
import { PhotoCropper } from '../common/PhotoCropper'

export const STATUS_OPTIONS: ReadonlyArray<{ value: TalentStatus; label: string }> = (
  Object.keys(TALENT_STATUS_LABELS) as TalentStatus[]
).map((value) => ({
  value,
  label: TALENT_STATUS_LABELS[value],
}))

export function CastView() {
  const cast = useSchedStore((s) => s.doc.cast)
  const extras = useSchedStore((s) => s.doc.extras)
  const st = useSchedStore.getState

  return (
    <div className="view-grid">
      <Card
        title="演員 (Talent)"
        actions={
          <button className="btn small primary" onClick={() => st().addCast()}>
            <Plus size={14} /> 新增演員
          </button>
        }
      >
        {cast.length === 0 && <p className="empty">尚未新增演員。</p>}
        {cast.map((c) => (
          <div className="person-card" key={c.id}>
            <div className="person-head">
              <PhotoCropper assetId={c.photoAssetId} onChange={(id) => st().updateCast(c.id, { photoAssetId: id })} />
              <span className="badge">{c.number}</span>
              <TextField label="角色名稱" value={c.characterName} onChange={(v) => st().updateCast(c.id, { characterName: v })} />
              <TextField label="演員姓名" value={c.actorName} onChange={(v) => st().updateCast(c.id, { actorName: v })} />
              <SelectField label="狀態" value={c.status} options={STATUS_OPTIONS} onChange={(v) => st().updateCast(c.id, { status: v })} />
              <button className="icon-btn danger" onClick={() => st().removeCast(c.id)} aria-label="刪除">
                <Trash2 size={15} />
              </button>
            </div>
            <div className="person-times">
              <TimeField label="抵達 (Call)" value={c.callTime} onChange={(v) => st().updateCast(c.id, { callTime: v })} />
              <TimeField label="排練 (BLK/RHS)" value={c.blkRhs} onChange={(v) => st().updateCast(c.id, { blkRhs: v })} />
              <TimeField label="梳化／服裝 (H/MU)" value={c.muWard} onChange={(v) => st().updateCast(c.id, { muWard: v })} />
              <TimeField label="到達現場 (On Set)" value={c.onSet} onChange={(v) => st().updateCast(c.id, { onSet: v })} />
              <TextField label="接送" value={c.transpo} onChange={(v) => st().updateCast(c.id, { transpo: v })} />
              <TextField label="電話" value={c.phone ?? ''} onChange={(v) => st().updateCast(c.id, { phone: v })} />
              <TextField label="備註" className="span2" value={c.remarks} onChange={(v) => st().updateCast(c.id, { remarks: v })} />
            </div>
          </div>
        ))}
      </Card>

      <Card
        title="臨演／替身 (Extras / Standins)"
        actions={
          <button className="btn small" onClick={() => st().addExtra()}>
            <Plus size={14} /> 新增
          </button>
        }
      >
        {extras.length === 0 && <p className="muted">尚無臨演或替身</p>}
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
    </div>
  )
}
