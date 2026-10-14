import { richToPlain } from '@/lib/utils'
import { DayTransport } from './DayTransport'
import { Section, dash } from './DayParts'
import type { DayCtx } from './DayParts'
import { RichView } from './RichView'

export function DayPageTwo(ctx: DayCtx) {
  const { doc, day } = ctx
  const rows = doc.departments.flatMap((d) =>
    doc.crew
      .filter((c) => c.departmentId === d.id && (day.crewCalls[c.id]?.working ?? true))
      .map((c) => ({ dept: d.name, c, call: day.crewCalls[c.id]?.callTime || day.crewCall })),
  )

  return (
    <div className="cs-page">
      <Section title="工作人員通告 Crew Call" className="cs-crew-section">
        <table className="cs-table">
          <thead>
            <tr>
              <th>部門</th>
              <th>職位</th>
              <th>姓名</th>
              <th>通告</th>
              <th>電話</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="center it">
                  本日無工作人員通告
                </td>
              </tr>
            )}
            {rows.map(({ dept, c, call }) => (
              <tr key={c.id}>
                <td>{dept}</td>
                <td>{c.position}</td>
                <td>{c.name}</td>
                <td className="center">{dash(call)}</td>
                <td>{dash(c.phone)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <DayTransport {...ctx} />

      <div className="cs-two">
        <div>
          <h3 className="cs-bar">額外劇組備註 ADDITIONAL CREW NOTES</h3>
          <div className="cs-box">
            {richToPlain(day.additionalCrewNotes).trim() ? (
              <RichView value={day.additionalCrewNotes} />
            ) : (
              <p className="it">無備註</p>
            )}
          </div>
        </div>
        <div>
          <h3 className="cs-bar">常用聯絡人 USEFUL CONTACTS</h3>
          <div className="cs-box">
            {doc.usefulContacts.length === 0 ? (
              <p className="it">無聯絡人</p>
            ) : (
              doc.usefulContacts.map((c) => (
                <p key={c.id}>
                  <b>{c.label}</b> {c.name} {c.phone}
                </p>
              ))
            )}
          </div>
        </div>
      </div>

      <h3 className="cs-bar">今日語錄 QUOTE OF THE DAY</h3>
      <div className="cs-box">{day.quoteOfTheDay}</div>
    </div>
  )
}
