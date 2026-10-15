import { useEffect, useRef, useState } from 'react'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { AnimatePresence, motion } from 'framer-motion'
import { Coffee, Film, Plus } from 'lucide-react'
import { useCurrentDay, useProjectStore } from '@/store/useProjectStore'
import { Card } from '../common/Fields'
import { RundownRow } from './RundownRow'

export function RundownList() {
  const rundown = useCurrentDay().rundown
  const move = useProjectStore((s) => s.moveRundownItem)
  const addScene = useProjectStore((s) => s.addScene)
  const addBreak = useProjectStore((s) => s.addBreak)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const from = rundown.findIndex((r) => r.id === active.id)
    const to = rundown.findIndex((r) => r.id === over.id)
    if (from >= 0 && to >= 0) move(from, to)
  }

  const sceneCount = rundown.filter((r) => r.kind === 'scene').length

  const actionsRef = useRef<HTMLSpanElement>(null)
  const [showFloating, setShowFloating] = useState(false)

  useEffect(() => {
    const el = actionsRef.current
    if (!el) return
    const root = el.closest('.content')
    const observer = new IntersectionObserver(
      (entries) => setShowFloating(!entries[0].isIntersecting),
      { root, threshold: 0 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="fab-page">
      <Card
        title="拍攝行程表 (Rundown)"
        actions={
          <span ref={actionsRef} className="rundown-actions">
            <span className="muted">
              {sceneCount} 場
            </span>
            <button className="btn small" onClick={addBreak}>
              <Coffee size={14} /> 新增換景/休息
            </button>
            <button className="btn small primary" onClick={addScene}>
              <Plus size={14} /> <Film size={14} /> 新增場次
            </button>
          </span>
        }
      >
        {rundown.length === 0 && <p className="empty">這一天尚未排入任何場次，請按「新增場次」。</p>}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={rundown.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <div className="rundown-list">
              <AnimatePresence initial={false}>
                {rundown.map((item) => (
                  <RundownRow key={item.id} item={item} />
                ))}
              </AnimatePresence>
            </div>
          </SortableContext>
        </DndContext>
      </Card>
      <div className="fab-wrap">
        <AnimatePresence>
          {showFloating && (
            <motion.div
              className="fab-group"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
            >
              <button className="btn" onClick={addBreak}>
                <Coffee size={14} /> 新增換景/休息
              </button>
              <button className="btn primary" onClick={addScene}>
                <Plus size={14} /> <Film size={14} /> 新增場次
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
