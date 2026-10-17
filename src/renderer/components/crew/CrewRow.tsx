import { memo } from 'react'
import type { CSSProperties } from 'react'
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import { GripVertical, Trash2 } from 'lucide-react'
import type { CrewCall, CrewMember } from '@shared/schema'
import { useProjectStore } from '@/store/useProjectStore'
import { TextField, TimeField } from '../common/Fields'

/** 拖曳把手需要的 dnd-kit 屬性（由 useSortable 取得，再往下傳給被 memo 的列內容） */
interface DragHandleProps {
  attributes: DraggableAttributes
  listeners: DraggableSyntheticListeners
  setActivatorNodeRef: (node: HTMLElement | null) => void
}

/**
 * 工作人員的可排序列。
 *
 * 與行程表、演員名單相同，把「位移節點」與「動畫節點」拆成兩層：
 *   外層 .crew-item 只套用 dnd-kit 的 transform／transition（相鄰列自動讓位＝排擠效果）。
 *   內層 .crew-row  才是 framer-motion 的動畫元素（只做進／退場的高度與透明度）。
 * 兩者若併成同一元素，framer-motion 的 layout 投影會覆寫 transform，拖曳時就會抖動。
 *
 * 每個部門各有自己的 DndContext，因此只能在同一部門內調整順序。
 */
export function CrewRow({
  member,
  call,
  dayCall,
}: {
  member: CrewMember
  call: CrewCall
  dayCall: string
}) {
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: member.id })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className={`crew-item${isDragging ? ' dragging' : ''}`}>
      <CrewRowBody
        member={member}
        call={call}
        dayCall={dayCall}
        attributes={attributes}
        listeners={listeners}
        setActivatorNodeRef={setActivatorNodeRef}
      />
    </div>
  )
}

/**
 * 列的內容（含動畫層）。
 *
 * 以 memo 包住：拖曳時 dnd-kit 每一影格都會更新外層的 transform 而重新渲染 CrewRow，
 * 這裡的 props 在拖曳過程中參考都不變，因此整列內容（欄位、勾選框、時間）不會跟著重繪。
 * 版型仍沿用 .row-inline，.crew-row 是動畫層的標記；未出勤時加上 off，
 * 由 .crew-row.row-inline.off 負責淡化並把欄位文字轉灰（見 components.css）。
 */
const CrewRowBody = memo(function CrewRowBody({
  member,
  call,
  dayCall,
  attributes,
  listeners,
  setActivatorNodeRef,
}: {
  member: CrewMember
  call: CrewCall
  dayCall: string
} & DragHandleProps) {
  const st = useProjectStore.getState

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={`crew-row row-inline${call.working ? '' : ' off'}`}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="drag-handle"
        aria-label="拖曳排序"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>
      <TextField placeholder="職位" value={member.position} onChange={(v) => st().updateCrew(member.id, { position: v })} />
      <TextField placeholder="姓名" value={member.name} onChange={(v) => st().updateCrew(member.id, { name: v })} />
      <TextField placeholder="電話" value={member.phone ?? ''} onChange={(v) => st().updateCrew(member.id, { phone: v })} />
      <label className="check small">
        <input type="checkbox" checked={call.working} onChange={(e) => st().setCrewCall(member.id, { working: e.target.checked })} />
        本日出勤
      </label>
      <TimeField
        compact
        label={`通告（預設 ${dayCall || '—'}）`}
        value={call.callTime}
        onChange={(v) => st().setCrewCall(member.id, { callTime: v })}
      />
      <button className="icon-btn danger" onClick={() => st().removeCrew(member.id)} aria-label="刪除">
        <Trash2 size={14} />
      </button>
    </motion.div>
  )
})
