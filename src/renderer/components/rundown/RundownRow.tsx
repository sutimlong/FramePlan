import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import { GripVertical, Trash2 } from 'lucide-react'
import type { RundownItem } from '@shared/schema'
import { useProjectStore as useSchedStore } from '@/store/useProjectStore'
import { SelectField, TextField, TimeField } from '../common/Fields'
import { SlateEditor } from '../editor/SlateEditor'
import { CAMERA_MOVEMENT_GROUPS } from './cameraMovementOptions'
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

export function RundownRow({ item }: { item: RundownItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const update = useSchedStore((s) => s.updateRundownItem)
  const remove = useSchedStore((s) => s.removeRundownItem)
  const cast = useSchedStore((s) => s.doc.cast)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 5 : undefined,
    opacity: isDragging ? 0.85 : 1,
  }

  const handle = (
    <button className="drag-handle" {...attributes} {...listeners} aria-label="拖曳排序">
      <GripVertical size={16} />
    </button>
  )

  if (item.kind === 'break') {
    return (
      <motion.div
        ref={setNodeRef}
        style={style}
        layout="position"
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
      ref={setNodeRef}
      style={style}
      layout="position"
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
          <TextField label="場次" className="w-sm" value={item.sceneNumber} onChange={(v) => update(item.id, { sceneNumber: v })} />
          <TextField label="鏡號" className="w-sm" value={item.shotNumber} onChange={(v) => update(item.id, { shotNumber: v })} />
          <SelectField
            label="鏡頭運動"
            className="w-lg"
            value={item.cameraMovement}
            placeholder="-"
            groups={CAMERA_MOVEMENT_GROUPS}
            onChange={(v) => update(item.id, { cameraMovement: v })}
          />
          <SelectField label="內/外景" value={item.intExt} options={INT_EXT} onChange={(v) => update(item.id, { intExt: v })} />
          <SelectField label="日/夜" value={item.dayNight} options={DAY_NIGHT} onChange={(v) => update(item.id, { dayNight: v })} />
          <TextField label="場景 (Set)" value={item.setName} onChange={(v) => update(item.id, { setName: v })} />
          <TextField label="地點" value={item.location} onChange={(v) => update(item.id, { location: v })} />
          <TextField label="臨演" className="w-md" value={item.extrasNote} onChange={(v) => update(item.id, { extrasNote: v })} />
        </div>
        <SlateEditor
          compact
          minHeight={36}
          value={item.description}
          onChange={(v) => update(item.id, { description: v })}
          placeholder="拍攝內容摘要…"
        />
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
}
