import { motion } from 'framer-motion'
import { ArrowDownAZ, Copy, Plus, Trash2 } from 'lucide-react'
import { confirmAction } from '@/lib/confirm'
import { formatDateShort } from '@/lib/utils'
import { useProjectStore } from '@/store/useProjectStore'

export function DayBar() {
  const days = useProjectStore((s) => s.doc.days)
  const currentDayId = useProjectStore((s) => s.currentDayId)
  const setCurrentDay = useProjectStore((s) => s.setCurrentDay)
  const addDay = useProjectStore((s) => s.addDay)
  const removeDay = useProjectStore((s) => s.removeDay)
  const sortDays = useProjectStore((s) => s.sortDays)

  const current = days.find((d) => d.id === currentDayId) ?? days[0]
  const index = days.findIndex((d) => d.id === current.id)

  const onRemove = async () => {
    if (days.length <= 1) return
    const label = `第 ${index + 1} 天（${formatDateShort(current.date)}）`
    const ok = await confirmAction({
      message: `確定刪除 ${label} 的通告表？`,
      detail: '此天的行程與出勤設定都會移除，演員與工作人員名單不受影響。',
      confirmLabel: '刪除',
      danger: true,
    })
    if (ok) removeDay(current.id)
  }

  return (
    <div className="daybar">
      <div className="day-tabs" role="tablist">
        {days.map((d, i) => (
          <button
            key={d.id}
            role="tab"
            aria-selected={d.id === current.id}
            className={`day-tab ${d.id === current.id ? 'active' : ''}`}
            onClick={() => setCurrentDay(d.id)}
          >
            <span className="day-no">第 {i + 1} 天</span>
            <span className="day-date">{formatDateShort(d.date)}</span>
            {d.id === current.id && <motion.span layoutId="day-underline" className="day-underline" />}
          </button>
        ))}
      </div>
      <div className="day-actions">
        <button className="btn small" onClick={() => addDay('blank')} title="新增空白的一天">
          <Plus size={14} /> 新增一天
        </button>
        <button className="btn small" onClick={() => addDay('copy')} title="複製目前這天的內容到新的一天">
          <Copy size={14} /> 複製此天
        </button>
        <button className="btn small" onClick={sortDays} title="依日期排序">
          <ArrowDownAZ size={14} />
        </button>
        <button className="btn small danger" onClick={onRemove} disabled={days.length <= 1} title="刪除目前這天">
          <Trash2 size={14} /> 刪除
        </button>
      </div>
    </div>
  )
}
