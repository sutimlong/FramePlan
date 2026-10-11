import { IE, Section, dash, formatTalentStatus } from './DayParts'
import type { DayCtx } from './DayParts'
import { RichView } from './RichView'

export function ScheduleTable({ doc, day }: DayCtx) {
  const castById = new Map(doc.cast.map((c) => [c.id, c]))
  return (
    <Section title="今日行程 Today's Schedule">
      <table className="cs-table">
        <thead>
          <tr>
            <th>時間</th>
            <th>場次</th>
            <th>場景／內容</th>
            <th>演員</th>
            <th>臨演</th>
            <th>日/夜</th>
            <th>頁數</th>
            <th>地點</th>
          </tr>
        </thead>
        <tbody>
          {day.rundown.length === 0 && (
            <tr>
              <td colSpan={8} className="center it">
                尚未排入場次
              </td>
            </tr>
          )}
          {day.rundown.map((r) =>
            r.kind === 'break' ? (
              <tr key={r.id} className="brk">
                <td>{dash(r.time)}</td>
                <td colSpan={7}>
                  {r.label}
                  {r.durationMin ? `（${r.durationMin} 分鐘）` : ''}
                </td>
              </tr>
            ) : (
              <tr key={r.id}>
                <td>{dash(r.time)}</td>
                <td className="center">{r.sceneNumber}</td>
                <td>
                  <b>
                    {IE[r.intExt]}. {r.setName}
                  </b>
                  <RichView value={r.description} />
                </td>
                <td className="center">
                  {r.castIds
                    .map((id) => castById.get(id)?.number)
                    .filter((n) => n !== undefined)
                    .join(', ') || '-'}
                </td>
                <td>{dash(r.extrasNote)}</td>
                <td className="center">{r.dayNight}</td>
                <td className="center">{dash(r.pages)}</td>
                <td>{dash(r.location)}</td>
              </tr>
            ),
          )}
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
