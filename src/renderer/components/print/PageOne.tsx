import { MapPin } from 'lucide-react'
import type { SchedDocument } from '@shared/schema'
import { isRichEmpty } from '@/lib/utils'
import { COND, Header, Place, dash } from './PrintParts'
import { RichView } from './RichView'
import { ScheduleTable, TalentTable } from './Tables'

export function PageOne({ doc }: { doc: SchedDocument }) {
  const g = doc.general
  const w = doc.weather
  const unit = `°${w?.tempUnit || 'C'}`
  const deptNotes = doc.departmentNotes.filter((n) => !isRichEmpty(n.content))
  const deptName = (id: string) => doc.departments.find((d) => d.id === id)?.name ?? ''

  return (
    <div className="cs-page">
      <Header doc={doc} />

      <div className="cs-top">
        <div className="cs-keypeople">
          {g.keyPeople.map((k) => (
            <p key={k.id}>
              <b>{k.title}</b> {k.name} {k.phone}
            </p>
          ))}
          <p className="meta">現場醫護：{dash(g.setMedic)}</p>
          <p className="meta">劇本版本：{dash(g.scriptVersion)}</p>
          <p className="meta">排程版本：{dash(g.scheduleVersion)}</p>
        </div>
        <div className="cs-places">
          <Place p={doc.locations.productionOffice} title="製片辦公室" />
          <MapPin className="cs-pin" size={34} />
          <Place p={doc.locations.nearestHospital} title="最近醫院" />
          <Place p={doc.locations.parking} title="停車場" />
          <Place p={doc.locations.basecamp} title="基地營" />
          <div className="cs-place wide">
            <h3>主拍攝地</h3>
            <p>{doc.locations.mainShootLocation.address}</p>
            {!isRichEmpty(doc.locations.freeNotes) && <RichView value={doc.locations.freeNotes} />}
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

      <ScheduleTable doc={doc} />
      <TalentTable doc={doc} />

      <div className="cs-bottom">
        <div className="cs-extras">
          <h3 className="cs-bar">臨演／替身 EXTRAS/STANDINS</h3>
          {doc.extras.length === 0 ? (
            <p className="it center">今日無臨演／替身</p>
          ) : (
            doc.extras.map((x) => (
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
