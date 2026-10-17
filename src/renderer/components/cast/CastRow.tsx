import { memo, useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import { GripVertical, Trash2 } from 'lucide-react'
import type { CastMember } from '@shared/schema'
import { confirmAction } from '@/lib/confirm'
import { useProjectStore } from '@/store/useProjectStore'
import { TextField } from '../common/Fields'

/** 拖曳把手需要的 dnd-kit 屬性（由 useSortable 取得，再往下傳給被 memo 的列內容） */
interface DragHandleProps {
  attributes: DraggableAttributes
  listeners: DraggableSyntheticListeners
  setActivatorNodeRef: (node: HTMLElement | null) => void
}

/**
 * 演員名單的可排序列。
 *
 * 與行程表相同，把「位移節點」與「動畫節點」拆成兩層：
 *   外層 .cast-item 只套用 dnd-kit 的 transform／transition（相鄰列自動讓位＝排擠效果）。
 *   內層 .cast-row  才是 framer-motion 的動畫元素（只做進／退場的高度與透明度）。
 * 兩者若併成同一元素，framer-motion 的 layout 投影會覆寫 transform，拖曳時就會抖動、跟不上指標。
 *
 * 拖曳只改變名單順序，不會動到編號；編號可直接點擊欄位修改。
 */
export function CastRow({ member }: { member: CastMember }) {
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: member.id })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className={`cast-item${isDragging ? ' dragging' : ''}`}>
      <CastRowBody
        member={member}
        attributes={attributes}
        listeners={listeners}
        setActivatorNodeRef={setActivatorNodeRef}
      />
    </div>
  )
}

/**
 * 編號欄位：沿用原本的深色圓角徽章外觀，但改成可直接輸入。
 *
 * 輸入過程保留使用者打字的字串（清空或打成非數字時先不寫回 store），
 * 只有合法數字才即時寫回；失焦時再回到 store 的值。
 * 這樣才不會出現「打一半被格式化」或「清空後立刻跳回 0」的情況。
 */
function CastNumberField({ id, number }: { id: string; number: number }) {
  const [draft, setDraft] = useState(String(number))

  useEffect(() => {
    setDraft(String(number))
  }, [number])

  const change = (v: string) => {
    setDraft(v)
    const n = Number(v)
    if (/^\d+$/.test(v) && n >= 1) useProjectStore.getState().updateCast(id, { number: n })
  }

  return (
    <label className="badge badge-edit" title="編號（可點擊修改）">
      <input
        type="text"
        inputMode="numeric"
        aria-label="編號"
        value={draft}
        onChange={(e) => change(e.target.value)}
        onBlur={() => setDraft(String(number))}
      />
    </label>
  )
}

/**
 * 列的內容（含動畫層）。
 *
 * 以 memo 包住：拖曳時 dnd-kit 每一影格都會更新外層的 transform 而重新渲染 CastRow，
 * 這裡的 props（member 與 dnd-kit 把手屬性）在拖曳過程中參考都不變，因此整列內容
 * （文字欄位、編號欄位）不會跟著重繪。
 * framer-motion 的退場動畫取自 presence context，motion 元件是以 useContext 訂閱，不受 memo 影響。
 */
const CastRowBody = memo(function CastRowBody({
  member,
  attributes,
  listeners,
  setActivatorNodeRef,
}: { member: CastMember } & DragHandleProps) {
  const st = useProjectStore.getState

  const handle = (
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
  )

  const remove = async () => {
    const name = member.characterName || member.actorName || '未命名'
    const ok = await confirmAction({
      message: `刪除「${name}」？`,
      detail: '所有天的通告紀錄都會一起移除。',
      confirmLabel: '刪除',
      danger: true,
    })
    if (ok) st().removeCast(member.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="cast-row"
    >
      {handle}
      <CastNumberField id={member.id} number={member.number} />
      <TextField label="角色名稱" value={member.characterName} onChange={(v) => st().updateCast(member.id, { characterName: v })} />
      <TextField label="演員姓名" value={member.actorName} onChange={(v) => st().updateCast(member.id, { actorName: v })} />
      <TextField label="電話" value={member.phone ?? ''} onChange={(v) => st().updateCast(member.id, { phone: v })} />
      <TextField label="Email" value={member.email ?? ''} onChange={(v) => st().updateCast(member.id, { email: v })} />
      <button
        className="icon-btn danger"
        title="刪除演員（所有天的出勤紀錄一併移除）"
        onClick={remove}
      >
        <Trash2 size={15} />
      </button>
    </motion.div>
  )
})
