import { memo } from 'react'
import type { CSSProperties } from 'react'
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import { GripVertical, Trash2 } from 'lucide-react'
import type { RundownItem } from '@shared/schema'
import { useProjectStore as useSchedStore } from '@/store/useProjectStore'
import { SelectField, TextField, TimeField } from '../common/Fields'
import { SlateEditor } from '../editor/SlateEditor'
import { CAMERA_MOVEMENT_CUSTOM, CAMERA_MOVEMENT_GROUPS } from './cameraMovementOptions'
import { StoryboardPicker } from './StoryboardPicker'

const INT_EXT = [
  { value: 'INT', label: '內景' },
  { value: 'EXT', label: '外景' },
  { value: 'INT/EXT', label: '內/外景' },
] as const
const DAY_NIGHT = [
  { value: 'D', label: '日' },
  { value: 'N', label: '夜' },
  { value: 'DAWN', label: '晨' },
  { value: 'DUSK', label: '昏' },
] as const

/** 拖曳把手需要的 dnd-kit 屬性（由 useSortable 取得，再往下傳給被 memo 的列內容） */
interface DragHandleProps {
  attributes: DraggableAttributes
  listeners: DraggableSyntheticListeners
  setActivatorNodeRef: (node: HTMLElement | null) => void
}

/**
 * 行程表的可排序列。
 *
 * 拖曳要順的關鍵，是把「位移節點」與「動畫節點」拆成兩層：
 *   外層 .rundown-item  只套用 dnd-kit 的 transform／transition，位移完全由 dnd-kit 決定。
 *   內層 .rundown-row   才是 framer-motion 的動畫元素（只做進／退場的高度與透明度）。
 * 兩者若併成同一元素，framer-motion 的 layout 投影會接管並覆寫該元素的 transform
 * （必要時直接設成 none），拖曳時就會抖動、跟不上指標；因此這裡也不再使用 layout 屬性。
 */
export function RundownRow({ item }: { item: RundownItem }) {
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className={`rundown-item${isDragging ? ' dragging' : ''}`}>
      <RundownRowBody
        item={item}
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
 * 以 memo 包住：拖曳時 dnd-kit 每一影格都會更新外層的 transform 而重新渲染 RundownRow，
 * 這裡的 props（item 與 dnd-kit 把手屬性）在拖曳過程中參考都不變，因此整列內容
 * （Slate 編輯器、演員 chips、分鏡圖）不會跟著重繪。
 * framer-motion 的退場動畫取自 presence context，motion 元件是以 useContext 訂閱，
 * 不受 memo 影響，刪除列時的動畫仍會正常播放。
 */
const RundownRowBody = memo(function RundownRowBody({
  item,
  attributes,
  listeners,
  setActivatorNodeRef,
}: { item: RundownItem } & DragHandleProps) {
  const update = useSchedStore((s) => s.updateRundownItem)
  const remove = useSchedStore((s) => s.removeRundownItem)
  const cast = useSchedStore((s) => s.doc.cast)

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

  if (item.kind === 'break') {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="rundown-row break"
      >
        {handle}
        <TimeField compact value={item.time} onChange={(v) => update(item.id, { time: v })} />
        <TextField value={item.label} placeholder="休息／午餐／換景" onChange={(v) => update(item.id, { label: v })} />
        <label className="field compact">
          <span className="field-label">分鐘</span>
          <input
            type="number"
            min={0}
            value={item.durationMin ?? ''}
            onChange={(e) => update(item.id, { durationMin: e.target.value === '' ? undefined : Number(e.target.value) })}
          />
        </label>
        <button className="icon-btn danger" onClick={() => remove(item.id)} aria-label="刪除">
          <Trash2 size={15} />
        </button>
      </motion.div>
    )
  }

  const toggleCast = (id: string) =>
    update(item.id, {
      castIds: item.castIds.includes(id) ? item.castIds.filter((c) => c !== id) : [...item.castIds, id],
    })

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="rundown-row scene"
    >
      {handle}
      <div className="scene-body">
        <div className="scene-top">
          <TimeField label="時間" compact value={item.time} onChange={(v) => update(item.id, { time: v })} />
          <TimeField label="結束" compact value={item.endTime ?? ''} onChange={(v) => update(item.id, { endTime: v })} />
          <TextField label="場次" className="w-md" value={item.sceneNumber} onChange={(v) => update(item.id, { sceneNumber: v })} />
          <TextField label="鏡號" className="w-md" value={item.shotNumber} onChange={(v) => update(item.id, { shotNumber: v })} />
          <SelectField
            label="鏡頭運動"
            className="w-lg"
            value={item.cameraMovement}
            placeholder="-"
            groups={CAMERA_MOVEMENT_GROUPS}
            onChange={(v) => update(item.id, { cameraMovement: v })}
          />
          {item.cameraMovement === CAMERA_MOVEMENT_CUSTOM && (
            <TextField
              label="自訂鏡頭運動"
              value={item.customCameraMovement ?? ''}
              onChange={(v) => update(item.id, { customCameraMovement: v })}
            />
          )}
          <SelectField label="內/外景" className="w-sm" value={item.intExt} options={INT_EXT} onChange={(v) => update(item.id, { intExt: v })} />
          <SelectField label="日/夜" className="w-xs" value={item.dayNight} options={DAY_NIGHT} onChange={(v) => update(item.id, { dayNight: v })} />
        </div>
        <div className="scene-top">
          <TextField label="場景 (Set)" value={item.setName} onChange={(v) => update(item.id, { setName: v })} />
          <TextField label="地點" value={item.location} onChange={(v) => update(item.id, { location: v })} />
          <TextField label="臨演" value={item.extrasNote} onChange={(v) => update(item.id, { extrasNote: v })} />
          <TextField label="備註" value={item.remark} onChange={(v) => update(item.id, { remark: v })} />
        </div>
        <div className="scene-desc">
          <span className="field-label">拍攝內容摘要</span>
          <SlateEditor
            compact
            minHeight={36}
            value={item.description}
            onChange={(v) => update(item.id, { description: v })}
            placeholder="拍攝內容摘要…"
          />
        </div>
        <div className="cast-chips">
          <span className="field-label">演員</span>
          {cast.length === 0 && <span className="muted">請先於「演員」頁新增角色</span>}
          {cast.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`chip ${item.castIds.includes(c.id) ? 'on' : ''}`}
              onClick={() => toggleCast(c.id)}
              title={c.actorName}
            >
              {c.number}. {c.characterName || c.actorName || '未命名'}
            </button>
          ))}
        </div>
        <StoryboardPicker
          assetIds={item.storyboardAssetIds}
          onChange={(ids) => update(item.id, { storyboardAssetIds: ids })}
        />
      </div>
      <button className="icon-btn danger" onClick={() => remove(item.id)} aria-label="刪除">
        <Trash2 size={15} />
      </button>
    </motion.div>
  )
})
