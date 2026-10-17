import { useEffect, useRef, useState } from 'react'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Trash2 } from 'lucide-react'
import { confirmAction } from '@/lib/confirm'
import { defaultCrewCall } from '@/lib/defaults'
import { useCurrentDay, useProjectStore } from '@/store/useProjectStore'
import { Card, TextField } from '../common/Fields'
import { CrewRow } from './CrewRow'

export function CrewManager() {
  const departments = useProjectStore((s) => s.doc.departments)
  const crew = useProjectStore((s) => s.doc.crew)
  const day = useCurrentDay()
  const st = useProjectStore.getState
  const [newDept, setNewDept] = useState('')

  const addDeptBtnRef = useRef<HTMLButtonElement>(null)
  const [showFloatingAdd, setShowFloatingAdd] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  /**
   * 每個部門各有一組 DndContext，所以拖曳只會發生在同一部門內；
   * 這時直接用全體人員的索引做 arrayMove 即可（其他部門的相對順序不受影響）。
   */
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const from = crew.findIndex((c) => c.id === active.id)
    const to = crew.findIndex((c) => c.id === over.id)
    if (from >= 0 && to >= 0) st().moveCrew(from, to)
  }

  useEffect(() => {
    const el = addDeptBtnRef.current
    if (!el) return
    const root = el.closest('.content')
    const observer = new IntersectionObserver(
      (entries) => setShowFloatingAdd(!entries[0].isIntersecting),
      { root, threshold: 0 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const addDept = () => {
    const n = newDept.trim()
    if (!n) {
      st().showToast('error', '請先輸入部門名稱')
      return
    }
    st().addDepartment(n)
    setNewDept('')
  }

  return (
    <div className="view-grid fab-page">
      <p className="hint">人員名單由所有天共用；每位人員的「本日出勤」與「通告時間」只影響目前這一天。拖曳左側把手可調整同一部門內的人員順序。</p>

      <Card
        title="新增部門"
        actions={
          <button ref={addDeptBtnRef} className="btn small primary" onClick={addDept}>
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
                  onClick={async () => {
                    const ok = await confirmAction({
                      message: `刪除「${dep.name}」及其 ${members.length} 位人員？`,
                      detail: '所有天的紀錄都會移除。',
                      confirmLabel: '刪除',
                      danger: true,
                    })
                    if (ok) st().removeDepartment(dep.id)
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </>
            }
          >
            <TextField label="部門名稱" value={dep.name} onChange={(v) => st().renameDepartment(dep.id, v)} />
            {members.length === 0 && <p className="muted">此部門尚無人員</p>}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={members.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                <div className="crew-list">
                  <AnimatePresence initial={false}>
                    {members.map((m) => (
                      <CrewRow
                        key={m.id}
                        member={m}
                        call={day.crewCalls[m.id] ?? defaultCrewCall()}
                        dayCall={day.crewCall}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </SortableContext>
            </DndContext>
          </Card>
        )
      })}
      <div className="fab-wrap">
        <AnimatePresence>
          {showFloatingAdd && (
            <motion.div
              className="fab-group"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
            >
              <TextField placeholder="部門名稱" value={newDept} onChange={setNewDept} onEnter={addDept} />
              <button className="btn primary" onClick={addDept}>
                <Plus size={14} /> 新增部門
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
