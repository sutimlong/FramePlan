import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { AnimatePresence } from 'framer-motion'
import { Plus, Upload } from 'lucide-react'
import { useProjectStore } from '@/store/useProjectStore'
import { Card } from '../common/Fields'
import type { CastMember } from '@shared/schema'
import { CastRow } from './CastRow'

/** 取出單筆資料中第一個有值的字串欄位 */
function pickString(item: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = item[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

/** .cast 可能是陣列，或把名單放在 cast / actors / data 欄位裡 */
function pickCastList(data: unknown): Array<Record<string, unknown>> {
  const candidates: unknown[] = Array.isArray(data)
    ? [data]
    : data && typeof data === 'object'
      ? [
          (data as Record<string, unknown>).cast,
          (data as Record<string, unknown>).actors,
          (data as Record<string, unknown>).data,
        ]
      : []
  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue
    const items = candidate.filter(
      (x): x is Record<string, unknown> => typeof x === 'object' && x !== null,
    )
    if (items.length > 0) return items
  }
  return []
}

/** 共用演員名單：新增後，每一天都可以在「本日出勤」裡選用 */
export function CastList() {
  const cast = useProjectStore((s) => s.doc.cast)
  const move = useProjectStore((s) => s.moveCast)
  const st = useProjectStore.getState

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const from = cast.findIndex((c) => c.id === active.id)
    const to = cast.findIndex((c) => c.id === over.id)
    if (from >= 0 && to >= 0) move(from, to)
  }

  const handleImportCast = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const reader = new FileReader()
    reader.onerror = () => st().showToast('error', '讀取 .cast 檔案失敗')
    reader.onload = () => {
      let list: Array<Record<string, unknown>>
      try {
        list = pickCastList(JSON.parse(String(reader.result)))
      } catch {
        st().showToast('error', '無法解析 .cast 檔案格式，請確認是否為有效的 JSON。')
        return
      }
      if (list.length === 0) {
        st().showToast('error', '找不到可匯入的演員資料')
        return
      }

      const newCasts: Array<Partial<CastMember>> = []
      for (const item of list) {
        newCasts.push({
          characterName: pickString(item, ['name', 'characterName', 'role', 'character']),
          actorName: pickString(item, ['realName', 'actorName']),
          phone: pickString(item, ['contactPhone', 'phone', 'phoneNumber']),
          email: pickString(item, ['email']),
        })
      }

      st().addCasts(newCasts)
      st().showToast('info', `成功匯入 ${newCasts.length} 位演員`)
    }
    reader.readAsText(file)
  }

  return (
    <Card
      title="演員名單（所有天共用）"
      actions={
        <div style={{ display: 'flex', gap: '8px' }}>
          <label className="btn small outline" style={{ cursor: 'pointer' }}>
            <Upload size={14} /> 從.cast新增
            <input type="file" accept=".cast" hidden onChange={handleImportCast} />
          </label>
          <button className="btn small primary" onClick={() => st().addCast()}>
            <Plus size={14} /> 新增演員
          </button>
        </div>
      }
    >
      {cast.length === 0 && <p className="empty">尚未新增演員。</p>}
      <p className="hint">拖曳左側把手可調整順序；編號可直接點擊修改（拖曳排序不會改動編號）。</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={cast.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="cast-list">
            <AnimatePresence initial={false}>
              {cast.map((c) => (
                <CastRow key={c.id} member={c} />
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>
    </Card>
  )
}
