import { Fragment } from 'react'
import { DN, IE, Section, dash, formatTalentStatus } from './DayParts'
import type { DayCtx } from './DayParts'
import { RichView } from './RichView'
import { cameraMovementText } from '../rundown/cameraMovementOptions'
import { filledSceneDeptNotes } from '@/lib/utils'

/** 將臨演自由文字依「、」「，」「,」「/」「／」與換行拆成多個名稱 */
const splitExtras = (s: string) =>
  s
    .split(/[、，,／\/\n]+/)
    .map((x) => x.trim())
    .filter(Boolean)

export function ScheduleTable({ doc, day }: DayCtx) {
  const castById = new Map(doc.cast.map((c) => [c.id, c]))
  return (
    <Section title="今日行程 Today's Schedule" className="cs-sched-section">
      <table className="cs-table cs-sched">
        <colgroup>
          <col className="c-time" />
          <col className="c-scene" />
          <col className="c-shot" />
          <col className="c-cam" />
          <col className="c-sb" />
          <col className="c-desc" />
          <col className="c-people" />
          <col className="c-dn" />
          <col className="c-loc" />
        </colgroup>
        <thead>
          <tr>
            <th>時間</th>
            <th>場次</th>
            <th>鏡號</th>
            <th>鏡頭運動</th>
            <th>分鏡</th>
            <th>場景／內容</th>
            <th>演員／臨演</th>
            <th>日/夜</th>
            <th>地點</th>
          </tr>
        </thead>
        <tbody>
          {day.rundown.length === 0 && (
            <tr>
              <td colSpan={9} className="center it">
                尚未排入場次
              </td>
            </tr>
          )}
          {day.rundown.map((r) => {
            if (r.kind === 'break') {
              return (
                <tr key={r.id} className="brk">
                  <td>{dash(r.time)}</td>
                  <td colSpan={8}>
                    {r.label}
                    {r.durationMin ? `（${r.durationMin} 分鐘）` : ''}
                  </td>
                </tr>
              )
            }
            const noteLines = filledSceneDeptNotes(r.deptNotes)
            const remark = r.remark.trim()
            // 備註已與部門說明合併成同一列，因此有備註或有說明時就要多印一列
            const hasNoteRow = noteLines.length > 0 || remark !== ''
            return (
              <Fragment key={r.id}>
                <tr>
                  <td rowSpan={hasNoteRow ? 2 : undefined}>
                    {r.endTime ? `${dash(r.time)}–${r.endTime}` : dash(r.time)}
                  </td>
                  <td className="center">{r.sceneNumber}</td>
                  <td className="center">{dash(r.shotNumber)}</td>
                  <td className="center">{dash(cameraMovementText(r.cameraMovement, r.customCameraMovement))}</td>
                  <td className="sb-cell">
                    {r.storyboardAssetIds.length === 0 ? (
                      <span className="sb-empty">-</span>
                    ) : (
                      <div className="sb-thumbs">
                        {r.storyboardAssetIds.map((id) => {
                          const a = doc.assets[id]
                          return a ? (
                            <img key={id} src={`data:${a.mime};base64,${a.dataBase64}`} alt="分鏡" />
                          ) : null
                        })}
                      </div>
                    )}
                  </td>
                  <td>
                    <b>
                      {IE[r.intExt]}. {r.setName}
                    </b>
                    <RichView value={r.description} />
                  </td>
                  <td>
                    {r.castIds.length === 0 && !r.extrasNote.trim() ? (
                      '-'
                    ) : (
                      <div className="cs-pills">
                        {r.castIds.map((id) => {
                          const c = castById.get(id)
                          return c ? (
                            <span key={id} className="cs-pill">
                              {[c.characterName, c.actorName].filter(Boolean).join(' - ') || `#${c.number}`}
                            </span>
                          ) : null
                        })}
                        {splitExtras(r.extrasNote).map((name, i) => (
                          <span key={`x${i}`} className="cs-pill">
                            {`臨演 - ${name}`}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="center">{DN[r.dayNight] || r.dayNight}</td>
                  <td>{dash(r.location)}</td>
                </tr>
                {hasNoteRow && (
                  <tr className="cs-notes">
                    <td colSpan={8}>
                      {noteLines.map((n) => (
                        <div key={n.key} className="cs-note-line">
                          {`${n.label}：${n.text}`}
                        </div>
                      ))}
                      {remark !== '' && <div className="cs-note-line">{`備註：${remark}`}</div>}
                    </td>
                  </tr>
                )}
              </Fragment>
            )
            })}
        </tbody>
      </table>
    </Section>
  )
}

export function TalentTable({ doc, day }: DayCtx) {
  const working = doc.cast.filter((c) => day.castCalls[c.id]?.working)
  return (
    <Section title="演員 Talent">
      <table className="cs-table">
        <thead>
          <tr>
            <th>編號</th>
            <th>演員</th>
            <th>角色</th>
            <th>狀態</th>
            <th>接送</th>
            <th>通告</th>
            <th>排練</th>
            <th>梳化/服裝</th>
            <th>到場</th>
            <th>備註</th>
          </tr>
        </thead>
        <tbody>
          {working.length === 0 && (
            <tr>
              <td colSpan={10} className="center it">
                本日無演員通告
              </td>
            </tr>
          )}
          {working.map((c) => {
            const k = day.castCalls[c.id]
            return (
              <tr key={c.id}>
                <td className="center">{c.number}</td>
                <td>{c.actorName}</td>
                <td>{c.characterName}</td>
                <td className="center">{formatTalentStatus(k.status)}</td>
                <td className="center">{dash(k.transpo)}</td>
                <td className="center">{dash(k.callTime)}</td>
                <td className="center">{dash(k.blkRhs)}</td>
                <td className="center">{dash(k.muWard)}</td>
                <td className="center">{dash(k.onSet)}</td>
                <td>{dash(k.remarks)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Section>
  )
}
