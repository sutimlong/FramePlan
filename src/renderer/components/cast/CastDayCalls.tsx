import { defaultCastCall } from '@/lib/defaults'
import { useCurrentDay, useProjectStore } from '@/store/useProjectStore'
import { TALENT_STATUS_LABELS, type TalentStatus } from '@shared/schema'
import { Card, SelectField, TextField, TimeField } from '../common/Fields'

export const STATUS_OPTIONS: ReadonlyArray<{ value: TalentStatus; label: string }> = (
  Object.keys(TALENT_STATUS_LABELS) as TalentStatus[]
).map((value) => ({
  value,
  label: TALENT_STATUS_LABELS[value],
}))

/** 本日演員通告：勾選出勤的演員，才會出現在這一天的通告表 */
export function CastDayCalls() {
  const cast = useProjectStore((s) => s.doc.cast)
  const day = useCurrentDay()
  const setCall = useProjectStore((s) => s.setCastCall)

  return (
    <Card title="本日演員通告">
      {cast.length === 0 && <p className="muted">請先到上方的演員名單新增演員。</p>}
      {cast.map((c) => {
        const call = day.castCalls[c.id] ?? defaultCastCall()
        const label = `${c.number}. ${c.characterName || '（未命名角色）'} / ${c.actorName || '（未填演員）'}`
        return (
          <div className={`person-card ${call.working ? '' : 'off'}`} key={c.id}>
            <label className="check">
              <input type="checkbox" checked={call.working} onChange={(e) => setCall(c.id, { working: e.target.checked })} />
              <strong>{label}</strong>
              {!call.working && <span className="muted">本日不出勤</span>}
            </label>
            {call.working && (
              <div className="person-times">
                <SelectField label="狀態" value={call.status} options={STATUS_OPTIONS} onChange={(v) => setCall(c.id, { status: v })} />
                <TimeField label="抵達 (Call)" value={call.callTime} onChange={(v) => setCall(c.id, { callTime: v })} />
                <TimeField label="排練 (BLK/RHS)" value={call.blkRhs} onChange={(v) => setCall(c.id, { blkRhs: v })} />
                <TimeField label="梳化／服裝 (H/MU)" value={call.muWard} onChange={(v) => setCall(c.id, { muWard: v })} />
                <TimeField label="到達現場 (On Set)" value={call.onSet} onChange={(v) => setCall(c.id, { onSet: v })} />
                <TextField label="接送" value={call.transpo} onChange={(v) => setCall(c.id, { transpo: v })} />
                <TextField label="備註" className="span2" value={call.remarks} onChange={(v) => setCall(c.id, { remarks: v })} />
              </div>
            )}
          </div>
        )
      })}
    </Card>
  )
}
