import type { SchedDocument } from '@shared/schema'
import { richToPlain } from '@/lib/utils'
import { Header, Section, dash } from './PrintParts'
import { RichView } from './RichView'

export function PageTwo({ doc }: { doc: SchedDocument }) {
  const g = doc.general
  return (
    <div className="cs-page">
      <Header doc={doc} />

      <Section title="工作人員通告 Crew Call">
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
            {doc.crew.length === 0 && (
              <tr>
                <td colSpan={5} className="center it">
                  尚無工作人員
                </td>
              </tr>
            )}
            {doc.departments.flatMap((d) =>
              doc.crew
                .filter((c) => c.departmentId === d.id)
                .map((c) => (
                  <tr key={c.id}>
                    <td>{d.name}</td>
                    <td>{c.position}</td>
                    <td>{c.name}</td>
                    <td className="center">{c.callTime || g.crewCall || '-'}</td>
                    <td>{dash(c.phone)}</td>
                  </tr>
                )),
            )}
          </tbody>
        </table>
      </Section>

      <div className="cs-two">
        <div>
          <h3 className="cs-bar">額外劇組備註 ADDITIONAL CREW NOTES</h3>
          <div className="cs-box">
            {richToPlain(doc.additionalCrewNotes).trim() ? (
              <RichView value={doc.additionalCrewNotes} />
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
      <div className="cs-box">{doc.quoteOfTheDay}</div>
    </div>
  )
}
