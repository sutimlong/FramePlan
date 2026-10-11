import { FilePlus2, FileText, FolderOpen, Save, SaveAll } from 'lucide-react'
import { exportPdf, newDocument, openFile, saveFile } from '@/lib/fileActions'
import { useProjectStore } from '@/store/useProjectStore'

export function TopBar() {
  const filePath = useProjectStore((s) => s.filePath)
  const dirty = useProjectStore((s) => s.dirty)
  const name = filePath ? filePath.split('/').pop() : '未命名.sched'

  return (
    <div className="toolbar">
      <div className="toolbar-name">
        {name}
        {dirty && <span className="dot" title="尚未儲存" />}
      </div>
      <div className="toolbar-actions">
        <button className="btn" onClick={newDocument}>
          <FilePlus2 size={15} /> 新增
        </button>
        <button className="btn" onClick={() => void openFile()}>
          <FolderOpen size={15} /> 開啟.sched
        </button>
        <button className="btn" onClick={() => void saveFile(false)}>
          <Save size={15} /> 儲存.sched
        </button>
        <button className="btn" onClick={() => void saveFile(true)}>
          <SaveAll size={15} /> 另存新檔.sched
        </button>
        <button className="btn primary" onClick={() => void exportPdf()}>
          <FileText size={15} /> 匯出 PDF
        </button>
      </div>
    </div>
  )
}
