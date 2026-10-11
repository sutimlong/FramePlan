import { useProjectStore as useSchedStore } from '@/store/useProjectStore'
import { createEmptyDocument } from './defaults'
import { parseSchedDocument } from './validateSched'

const api = () => window.electronAPI

function notAvailable(): void {
  useSchedStore.getState().showToast('error', '此功能需在 Electron 桌面應用程式中使用')
}

/** 若有未儲存變更，詢問是否放棄 */
function confirmDiscard(): boolean {
  if (!useSchedStore.getState().dirty) return true
  return window.confirm('目前的通告表有尚未儲存的變更，確定要放棄嗎？')
}

export function newDocument(): void {
  if (!confirmDiscard()) return
  useSchedStore.getState().loadDocument(createEmptyDocument(), null)
  api()?.setCurrentFile(null)
}

export async function saveFile(forceAs = false): Promise<boolean> {
  const a = api()
  if (!a) {
    notAvailable()
    return false
  }
  const s = useSchedStore.getState()
  const req = { data: s.doc, suggestedName: s.doc.project.projectName }
  const res =
    forceAs || !s.filePath
      ? await a.saveSchedFileAs(req)
      : await a.saveSchedFile({ ...req, filePath: s.filePath })
  if (res.ok) {
    s.markSaved(res.filePath)
    s.showToast('info', '已儲存')
    return true
  }
  if (!res.canceled) s.showToast('error', `儲存失敗：${res.error ?? '未知錯誤'}`)
  return false
}

export async function openFile(): Promise<void> {
  const a = api()
  if (!a) return notAvailable()
  if (!confirmDiscard()) return
  const s = useSchedStore.getState()
  const res = await a.openSchedFile()
  if (!res.ok) {
    if (!res.canceled) s.showToast('error', res.error ?? '開啟失敗')
    return
  }
  const parsed = parseSchedDocument(res.data)
  if (!parsed.ok) {
    s.showToast('error', parsed.error)
    a.setCurrentFile(s.filePath)
    return
  }
  s.loadDocument(parsed.doc, res.filePath)
  s.showToast('info', '已開啟檔案')
}

export async function exportPdf(): Promise<void> {
  const a = api()
  if (!a) return notAvailable()
  const s = useSchedStore.getState()
  const prev = s.view
  // 切換到預覽視圖，確保 CallsheetPrintView 已掛載
  s.setView('preview')
  await new Promise((r) => setTimeout(r, 450))
  const res = await a.exportPdf({ suggestedName: s.doc.project.projectName })
  if (res.ok) s.showToast('info', `已匯出 PDF：${res.filePath}`)
  else if (!res.canceled) s.showToast('error', `匯出失敗：${res.error ?? '未知錯誤'}`)
  useSchedStore.getState().setView(prev === 'preview' ? 'preview' : prev)
}
