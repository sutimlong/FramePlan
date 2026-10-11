import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useSchedStore } from '@/store/useSchedStore'
import { Card, TextField, TimeField } from '../common/Fields'
import { PhotoCropper } from '../common/PhotoCropper'

export function CrewView() {
  const departments = useSchedStore((s) => s.doc.departments)
  const crew = useSchedStore((s) => s.doc.crew)
  const crewCall = useSchedStore((s) => s.doc.general.crewCall)
  const st = useSchedStore.getState
  const [newDept, setNewDept] = useState('')

  const addDept = () => {
    const n = newDept.trim()
    if (!n) return
    st().addDepartment(n)
    setNewDept('')
  }

  return (
    <div className="view-grid">
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
                    if (window.confirm(`刪除「${dep.name}」及其 ${members.length} 位人員？`)) st().removeDepartment(dep.id)
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </>
            }
          >
            <TextField label="部門名稱" value={dep.name} onChange={(v) => st().renameDepartment(dep.id, v)} />
            {members.length === 0 && <p className="muted">此部門尚無人員</p>}
            {members.map((m) => (
              <div className="row-inline" key={m.id}>
                <PhotoCropper assetId={m.photoAssetId} onChange={(id) => st().updateCrew(m.id, { photoAssetId: id })} />
                <TextField placeholder="職位" value={m.position} onChange={(v) => st().updateCrew(m.id, { position: v })} />
                <TextField placeholder="姓名" value={m.name} onChange={(v) => st().updateCrew(m.id, { name: v })} />
                <TimeField compact label={`通告（預設 ${crewCall || '—'}）`} value={m.callTime} onChange={(v) => st().updateCrew(m.id, { callTime: v })} />
                <TextField placeholder="電話" value={m.phone ?? ''} onChange={(v) => st().updateCrew(m.id, { phone: v })} />
                <button className="icon-btn danger" onClick={() => st().removeCrew(m.id)} aria-label="刪除">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </Card>
        )
      })}
    </div>
  )
}
