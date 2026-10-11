import { MapPin } from 'lucide-react'
import { isRichEmpty } from '@/lib/utils'
import { COND, Header, Place, dash } from './DayParts'
import type { DayCtx } from './DayParts'
import { ScheduleTable, TalentTable } from './DayTables'
import { RichView } from './RichView'

export function DayPageOne(ctx: DayCtx) {
  const { doc, day } = ctx
  const w = day.weather
  const unit = `°${w?.tempUnit || 'C'}`
  const deptNotes = day.departmentNotes.filter((n) => !isRichEmpty(n.content))
  const deptName = (id: string) => doc.departments.find((d) => d.id === id)?.name ?? ''

  return (
    <div className="cs-page">
      <Header {...ctx} />

      <div className="cs-top">
        <div className="cs-keypeople">
          {doc.project.keyPeople.map((k) => (
            <p key={k.id}>
              <b>{k.title}</b> {k.name} {k.phone}
            </p>
          ))}
          <p className="meta">現場醫護：{dash(day.setMedic)}</p>
          <p className="meta">劇本版本：{dash(doc.project.scriptVersion)}</p>
          <p className="meta">排程版本：{dash(day.scheduleVersion)}</p>
        </div>
        <div className="cs-places">
          <Place p={day.locations.productionOffice} title="製片辦公室" />
          <MapPin className="cs-pin" size={34} />
          <Place p={day.locations.nearestHospital} title="最近醫院" />
          <Place p={day.locations.parking} title="停車場" />
          <Place p={day.locations.basecamp} title="基地營" />
          <div className="cs-place wide">
            <h3>主拍攝地</h3>
            <p>{day.locations.mainShootLocation.address}</p>
            {!isRichEmpty(day.locations.freeNotes) && <RichView value={day.locations.freeNotes} />}
          </div>
        </div>
        <div className="cs-weather">
          <h3>天氣</h3>
          <div className="temps">
            <div>
              <b>
                {w?.low != null ? `${w.low} ${unit}` : '--'}
              </b>
              <small>最低溫</small>
            </div>
            <span className="cond-badge">{COND[w?.condition] || w?.condition || '晴'}</span>
            <div>
              <b>
                {w?.high != null ? `${w.high} ${unit}` : '--'}
              </b>
              <small>最高溫</small>
            </div>
          </div>
          {w?.summary ? <p className="summary">{w.summary}</p> : null}
          <p className="sun">
            <b>日出</b> {dash(w?.sunrise)} <b>日落</b> {dash(w?.sunset)}
          </p>
        </div>
      </div>

      <div className="cs-banner">{doc.safetyBanner.filter(Boolean).join(' | ')}</div>

      <ScheduleTable {...ctx} />
      <TalentTable {...ctx} />

      <div className="cs-bottom">
        <div className="cs-extras">
          <h3 className="cs-bar">臨演／替身 EXTRAS/STANDINS</h3>
          {day.extras.length === 0 ? (
            <p className="it center">今日無臨演／替身</p>
          ) : (
            day.extras.map((x) => (
              <p key={x.id}>
                {x.count} 位 {x.description} — {dash(x.callTime)} {x.notes}
              </p>
            ))
          )}
        </div>
        <div className="cs-dnotes">
          <h3 className="cs-bar outline">部門備註 DEPARTMENT NOTES</h3>
          {deptNotes.length === 0 ? (
            <p className="it">無部門備註</p>
          ) : (
            deptNotes.map((n) => (
              <div key={n.id}>
                <b>{deptName(n.departmentId)}</b>
                <RichView value={n.content} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
