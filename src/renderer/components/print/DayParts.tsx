import type { ReactNode } from 'react'
import { WEATHER_CONDITION_LABELS, type PlaceInfo, type SchedDocument, type ShootDay } from '@shared/schema'
import { formatDateZh } from '@/lib/utils'

export interface DayCtx {
  doc: SchedDocument
  day: ShootDay
  index: number
}

/** 通告表列印用的天氣狀況簡稱（採列印欄寬較小的短標籤） */
export const COND: Record<string, string> = {
  sunny: '晴',
  'partly-cloudy': WEATHER_CONDITION_LABELS['partly-cloudy'],
  cloudy: '陰',
  rain: '雨',
  snow: '雪',
  storm: WEATHER_CONDITION_LABELS.storm,
  fog: '霧',
}
export const IE: Record<string, string> = { INT: '內', EXT: '外', 'INT/EXT': '內/外' }
export const DN: Record<string, string> = { D: '日', N: '夜', DAWN: '晨', DUSK: '昏' }

export const dash = (s: string | undefined) => (s && s.trim() ? s : '-')
import { TALENT_STATUS_LABELS, type TalentStatus } from '@shared/schema'
export const formatTalentStatus = (s: string | undefined) => {
  if (!s || !s.trim()) return '-'
  return TALENT_STATUS_LABELS[s as TalentStatus] || s
}

export function Header({ doc, day, index }: DayCtx) {
  return (
    <header className="cs-header">
      <div className="cs-title">
        <h1>{doc.project.projectName || '未命名專案'}</h1>
        <p>{doc.project.companyName}</p>
      </div>
      <div className="cs-circle">
        <span>Crew Call</span>
        <strong>{day.crewCall || '--:--'}</strong>
      </div>
      <div className="cs-date">
        <p>{formatDateZh(day.date)}</p>
        <h2>
          第 {index + 1} 天 / 共 {doc.days.length} 天
        </h2>
      </div>
    </header>
  )
}

export function Place({ p, title }: { p: PlaceInfo; title: string }) {
  // 欄位名稱（label）為空時，不在預覽頁面上顯示該地點
  if (!p.label || !p.label.trim()) return null
  return (
    <div className="cs-place">
      <h3>{p.label || title}</h3>
      <p>{p.address}</p>
      {p.notes && <small>{p.notes}</small>}
    </div>
  )
}

export function Section({
  title,
  children,
  className,
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`cs-section ${className || ''}`.trim()}>
      <h3 className="cs-section-title">{title}</h3>
      {children}
    </section>
  )
}
