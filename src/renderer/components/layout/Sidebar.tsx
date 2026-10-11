import { CalendarDays, Car, Clapperboard, Eye, Info, StickyNote, Star, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { useProjectStore as useSchedStore } from '@/store/useProjectStore'
import type { ViewKey } from '@/store/useProjectStore'
import { getAppName } from '@/lib/appInfo'
import { cx } from '@/lib/utils'

const ITEMS: Array<{ key: ViewKey; label: string; icon: ReactNode }> = [
  { key: 'project', label: '專案設定', icon: <Info size={17} /> },
  { key: 'day', label: '本日資訊', icon: <CalendarDays size={17} /> },
  { key: 'rundown', label: '行程表', icon: <Clapperboard size={17} /> },
  { key: 'cast', label: '演員', icon: <Star size={17} /> },
  { key: 'crew', label: '工作人員', icon: <Users size={17} /> },
  { key: 'transport', label: '車表安排', icon: <Car size={17} /> },
  { key: 'notes', label: '本日備註', icon: <StickyNote size={17} /> },
]

export function Sidebar() {
  const view = useSchedStore((s) => s.view)
  const setView = useSchedStore((s) => s.setView)
  return (
    <nav className="sidebar">
      <div className="brand">{getAppName()}</div>
      {ITEMS.map((i) => (
        <button key={i.key} className={cx('nav-item', view === i.key && 'active')} onClick={() => setView(i.key)}>
          {i.icon}
          {i.label}
        </button>
      ))}
      <button 
        className={cx('nav-item preview-btn', view === 'preview' && 'active')} 
        onClick={() => setView('preview')}
      >
        <Eye size={17} />
        通告表預覽
      </button>
    </nav>
  )
}
