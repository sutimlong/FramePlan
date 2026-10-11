import { Plus, Trash2 } from 'lucide-react'
import { useProjectStore } from '@/store/useProjectStore'
import { Card, TextField } from '../common/Fields'

export function ProjectView() {
  const project = useProjectStore((s) => s.doc.project)
  const safety = useProjectStore((s) => s.doc.safetyBanner)
  const contacts = useProjectStore((s) => s.doc.usefulContacts)
  const st = useProjectStore.getState
  const patch = useProjectStore((s) => s.patch)
  const setProject = useProjectStore((s) => s.setProject)

  return (
    <div className="view-grid">
      <p className="hint">此頁的內容由所有拍攝日共用，修改後每一天的通告表都會一起更新。</p>

      <Card title="專案資訊">
        <div className="grid g2">
          <TextField label="專案名稱" value={project.projectName} onChange={(v) => setProject({ projectName: v })} />
          <TextField label="公司名稱" value={project.companyName} onChange={(v) => setProject({ companyName: v })} />
          <TextField label="劇本版本" value={project.scriptVersion} onChange={(v) => setProject({ scriptVersion: v })} />
        </div>
      </Card>

      <Card
        title="主要人員 (Key People)"
        actions={
          <button className="btn small" onClick={() => st().addKeyPerson()}>
            <Plus size={14} /> 新增
          </button>
        }
      >
        {project.keyPeople.length === 0 && <p className="muted">尚未新增主要人員</p>}
        {project.keyPeople.map((k) => (
          <div className="row-inline" key={k.id}>
            <TextField placeholder="職稱（導演、製片…）" value={k.title} onChange={(v) => st().updateKeyPerson(k.id, { title: v })} />
            <TextField placeholder="姓名" value={k.name} onChange={(v) => st().updateKeyPerson(k.id, { name: v })} />
            <TextField placeholder="電話" value={k.phone ?? ''} onChange={(v) => st().updateKeyPerson(k.id, { phone: v })} />
            <button className="icon-btn danger" onClick={() => st().removeKeyPerson(k.id)} aria-label="刪除">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </Card>

      <Card
        title="常用聯絡人 (Useful Contacts)"
        actions={
          <button className="btn small" onClick={() => st().addContact()}>
            <Plus size={14} /> 新增
          </button>
        }
      >
        {contacts.length === 0 && <p className="muted">尚無聯絡人</p>}
        {contacts.map((c) => (
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

      <Card
        title="安全標語列"
        actions={
          <button className="btn small" onClick={() => patch((d) => ({ ...d, safetyBanner: [...d.safetyBanner, ''] }))}>
            <Plus size={14} /> 新增標語
          </button>
        }
      >
        {safety.map((t, i) => (
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
      </Card>
    </div>
  )
}
