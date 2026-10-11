import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { defaultCrewCall } from '@/lib/defaults'
import { useCurrentDay, useProjectStore } from '@/store/useProjectStore'
import { Card, TextField, TimeField } from '../common/Fields'
import { PhotoCropper } from '../common/PhotoCropper'

export function CrewManager() {
  const departments = useProjectStore((s) => s.doc.departments)
  const crew = useProjectStore((s) => s.doc.crew)
  const day = useCurrentDay()
  const st = useProjectStore.getState
  const [newDept, setNewDept] = useState('')

  const addDept = () => {
    const n = newDept.trim()
    if (!n) return
    st().addDepartment(n)
    setNewDept('')
  }

  return (
    <div className="view-grid">
      <p className="hint">人員名單由所有天共用；每位人員的「本日出勤」與「通告時間」只影響目前這一天。</p>

      <Card
        title="新增部門"
        actions={
          <button className="btn small primary" onClick={addDept}>
            <Plus size={14} /> 新增部門
          </button>
        }
      >
        <TextField placeholder="部門名稱，例如：特效組" value={newDept} onChange={setNewDept} />
      </Card>

      {departments.map((dep) => {
        const members = crew.filter((c) => c.departmentId === dep.id)
        return (
          <Card
            key={dep.id}
            title={`${dep.name}（${members.length}）`}
            actions={
              <>
                <button className="btn small" onClick={() => st().addCrew(dep.id)}>
                  <Plus size={14} /> 新增人員
                </button>
                <button
                  className="icon-btn danger"
                  title="刪除部門"
                  onClick={() => {
                    if (window.confirm(`刪除「${dep.name}」及其 ${members.length} 位人員？所有天的紀錄都會移除。`)) {
                      st().removeDepartment(dep.id)
                    }
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </>
            }
          >
            <TextField label="部門名稱" value={dep.name} onChange={(v) => st().renameDepartment(dep.id, v)} />
            {members.length === 0 && <p className="muted">此部門尚無人員</p>}
            {members.map((m) => {
              const call = day.crewCalls[m.id] ?? defaultCrewCall()
              return (
                <div className={`row-inline ${call.working ? '' : 'off'}`} key={m.id}>
                  <PhotoCropper assetId={m.photoAssetId} onChange={(id) => st().updateCrew(m.id, { photoAssetId: id })} />
                  <TextField placeholder="職位" value={m.position} onChange={(v) => st().updateCrew(m.id, { position: v })} />
                  <TextField placeholder="姓名" value={m.name} onChange={(v) => st().updateCrew(m.id, { name: v })} />
                  <TextField placeholder="電話" value={m.phone ?? ''} onChange={(v) => st().updateCrew(m.id, { phone: v })} />
                  <label className="check small">
                    <input type="checkbox" checked={call.working} onChange={(e) => st().setCrewCall(m.id, { working: e.target.checked })} />
                    本日出勤
                  </label>
                  <TimeField
                    compact
                    label={`通告（預設 ${day.crewCall || '—'}）`}
                    value={call.callTime}
                    onChange={(v) => st().setCrewCall(m.id, { callTime: v })}
                  />
                  <button className="icon-btn danger" onClick={() => st().removeCrew(m.id)} aria-label="刪除">
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}
          </Card>
        )
      })}
    </div>
  )
}
