import { emptyRich } from '@/lib/utils'
import { useCurrentDay, useProjectStore } from '@/store/useProjectStore'
import { Card, TextField } from '../common/Fields'
import { SlateEditor } from '../editor/SlateEditor'

export function NotesView() {
  const day = useCurrentDay()
  const departments = useProjectStore((s) => s.doc.departments)
  const setDay = useProjectStore((s) => s.setDay)
  const setNote = useProjectStore((s) => s.setDepartmentNote)

  return (
    <div className="view-grid">
      <Card title="部門備註 (Department Notes)">
        {departments.map((dep) => {
          const note = day.departmentNotes.find((n) => n.departmentId === dep.id)
          return (
            <div key={dep.id} className="note-block">
              <h4>{dep.name}</h4>
              <SlateEditor
                value={note?.content ?? emptyRich()}
                onChange={(v) => setNote(dep.id, v)}
                placeholder={`${dep.name}的備註…`}
                minHeight={56}
              />
            </div>
          )
        })}
      </Card>

      <Card title="額外劇組備註 (Additional Crew Notes)">
        <SlateEditor
          value={day.additionalCrewNotes}
          onChange={(v) => setDay({ additionalCrewNotes: v })}
          placeholder="給全體劇組的補充說明…"
          minHeight={120}
        />
      </Card>

      <Card title="今日語錄 (Quote of the Day)">
        <TextField value={day.quoteOfTheDay} onChange={(v) => setDay({ quoteOfTheDay: v })} />
      </Card>
    </div>
  )
}
