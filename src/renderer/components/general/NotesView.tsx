import { Plus, Trash2 } from 'lucide-react'
import { emptyRich } from '@/lib/utils'
import { useSchedStore } from '@/store/useSchedStore'
import { Card, TextField } from '../common/Fields'
import { SlateEditor } from '../editor/SlateEditor'

export function NotesView() {
  const doc = useSchedStore((s) => s.doc)
  const patch = useSchedStore((s) => s.patch)
  const st = useSchedStore.getState

  return (
    <div className="view-grid">
      <Card title="部門備註 (Department Notes)">
        {doc.departments.map((dep) => {
          const note = doc.departmentNotes.find((n) => n.departmentId === dep.id)
          return (
            <div key={dep.id} className="note-block">
              <h4>{dep.name}</h4>
              <SlateEditor
                value={note?.content ?? emptyRich()}
                onChange={(v) => st().setDepartmentNote(dep.id, v)}
                placeholder={`${dep.name}的備註…`}
                minHeight={56}
              />
            </div>
          )
        })}
      </Card>

      <Card title="額外劇組備註 (Additional Crew Notes)">
        <SlateEditor
          value={doc.additionalCrewNotes}
          onChange={(v) => patch((d) => ({ ...d, additionalCrewNotes: v }))}
          placeholder="給全體劇組的補充說明…"
          minHeight={120}
        />
      </Card>

      <Card
        title="常用聯絡人 (Useful Contacts)"
        actions={
          <button className="btn small" onClick={() => st().addContact()}>
            <Plus size={14} /> 新增
          </button>
        }
      >
        {doc.usefulContacts.length === 0 && <p className="muted">尚無聯絡人</p>}
        {doc.usefulContacts.map((c) => (
          <div className="row-inline" key={c.id}>
            <TextField placeholder="類別（警局、消防…）" value={c.label} onChange={(v) => st().updateContact(c.id, { label: v })} />
            <TextField placeholder="姓名" value={c.name} onChange={(v) => st().updateContact(c.id, { name: v })} />
            <TextField placeholder="電話" value={c.phone ?? ''} onChange={(v) => st().updateContact(c.id, { phone: v })} />
            <button className="icon-btn danger" onClick={() => st().removeContact(c.id)} aria-label="刪除">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </Card>

      <Card title="今日語錄 (Quote of the Day)">
        <TextField value={doc.quoteOfTheDay} onChange={(v) => patch((d) => ({ ...d, quoteOfTheDay: v }))} />
      </Card>

      <Card title="安全標語列">
        {doc.safetyBanner.map((t, i) => (
          <div className="row-inline" key={i}>
            <TextField
              value={t}
              onChange={(v) => patch((d) => ({ ...d, safetyBanner: d.safetyBanner.map((x, j) => (j === i ? v : x)) }))}
            />
            <button
              className="icon-btn danger"
              onClick={() => patch((d) => ({ ...d, safetyBanner: d.safetyBanner.filter((_, j) => j !== i) }))}
              aria-label="刪除"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button className="btn small" onClick={() => patch((d) => ({ ...d, safetyBanner: [...d.safetyBanner, ''] }))}>
          <Plus size={14} /> 新增標語
        </button>
      </Card>
    </div>
  )
}
