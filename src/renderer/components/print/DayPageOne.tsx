import { MapPin } from 'lucide-react'
import type { SceneItem } from '@shared/schema'
import { formatTimestamp, isRichEmpty } from '@/lib/utils'
import { Header, Place, dash } from './DayParts'
import type { DayCtx } from './DayParts'
import { DayWeather } from './DayWeather'
import { ScheduleTable, TalentTable } from './DayTables'
import { RichView } from './RichView'

export function DayPageOne(ctx: DayCtx) {
  const { doc, day } = ctx
  const w = day.weather
  const deptNotes = day.departmentNotes.filter((n) => !isRichEmpty(n.content))
  const deptName = (id: string) => doc.departments.find((d) => d.id === id)?.name ?? ''
  // 由行程表每場的「臨演」欄位彙整，供底部「臨演／替身」區塊顯示
  const extrasNotes = day.rundown
    .filter((r): r is SceneItem => r.kind === 'scene')
    .map((r) => r.extrasNote.trim())
    .filter(Boolean)
  const structuredExtras = day.extras.filter((x) => x.description.trim())
  const extrasItems = [
    ...structuredExtras.map((x) =>
      `${x.count} 位 ${x.description}${x.callTime ? ` — ${x.callTime}` : ''}${x.notes ? ` ${x.notes}` : ''}`,
    ),
    ...extrasNotes,
  ]
  const hasExtras = extrasItems.length > 0
  const hasDeptNotes = deptNotes.length > 0

  return (
    <>
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
            <p className="meta">排程版本：{day.scheduleVersion?.trim() ? day.scheduleVersion : formatTimestamp()}</p>
          </div>
          {/* 地點欄位順序與「本日資訊」的地點卡一致：地點1 停車場、地點2 最近醫院、地點3 劇組辦公室、地點4 基地營 */}
          <div className="cs-places">
            <Place p={day.locations.parking} title="停車場" />
            <MapPin className="cs-pin" size={34} />
            <Place p={day.locations.nearestHospital} title="最近醫院" />
            <Place p={day.locations.productionOffice} title="劇組辦公室" />
            <Place p={day.locations.basecamp} title="基地營" />
            <div className="cs-place wide">
              <h3>{day.locations.mainShootLocation.label || '主拍攝地'}</h3>
              <p>{day.locations.mainShootLocation.address}</p>
              {!isRichEmpty(day.locations.freeNotes) && <RichView value={day.locations.freeNotes} />}
            </div>
          </div>
          <DayWeather w={w} />
        </div>

        <div className="cs-banner">{doc.safetyBanner.filter(Boolean).join(' | ')}</div>

        <TalentTable {...ctx} />

        {(hasExtras || hasDeptNotes) && (
          <div className="cs-bottom">
            {hasExtras && (
              <div className="cs-extras">
                <h3 className="cs-bar">臨演／替身 EXTRAS/STANDINS</h3>
                <p>{extrasItems.join('、')}</p>
              </div>
            )}
            {hasDeptNotes && (
              <div className="cs-dnotes">
                <h3 className="cs-bar outline">部門備註 DEPARTMENT NOTES</h3>
                {deptNotes.map((n) => (
                  <div key={n.id}>
                    <b>{deptName(n.departmentId)}</b>：
                    <RichView value={n.content} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="cs-page">
        <ScheduleTable {...ctx} />
      </div>
    </>
  )
}
