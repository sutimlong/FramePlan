import { useProjectStore as useSchedStore } from '@/store/useProjectStore'
import { confirmAction } from './confirm'
import { createEmptyDocument } from './defaults'
import { parseSchedDocument } from './validateSched'

const api = () => window.electronAPI

function notAvailable(): void {
  useSchedStore.getState().showToast('error', '此功能需在 Electron 桌面應用程式中使用')
}

/** 若有未儲存變更，詢問是否放棄 */
async function confirmDiscard(): Promise<boolean> {
  if (!useSchedStore.getState().dirty) return true
  return confirmAction({
    message: '目前的通告表有尚未儲存的變更，確定要放棄嗎？',
    detail: '放棄後，未儲存的變更將無法復原。',
    confirmLabel: '放棄變更',
    danger: true,
  })
}

export async function newDocument(): Promise<void> {
  if (!(await confirmDiscard())) return
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
  if (!(await confirmDiscard())) return
  const s = useSchedStore.getState()
  // 記住開啟前的檔案路徑：主程序在讀檔時會先把 currentFile 指向新檔，
  // 若後續解析失敗，必須還原成原本的檔案，避免存錯檔。
  const previousFilePath = s.filePath
  const res = await a.openSchedFile()
  if (!res.ok) {
    if (!res.canceled) s.showToast('error', res.error ?? '開啟失敗')
    return
  }
  const parsed = parseSchedDocument(res.data)
  if (!parsed.ok) {
    s.showToast('error', parsed.error)
    a.setCurrentFile(previousFilePath)
    return
  }
  s.loadDocument(parsed.doc, res.filePath)
  s.showToast('info', '已開啟檔案')
}

const nextFrame = (): Promise<void> => new Promise((resolve) => requestAnimationFrame(() => resolve()))

/** 等待預覽容器掛載完成（不使用固定時間等待，避免機器快慢造成空白 PDF） */
async function waitForPrintRoot(timeoutMs = 10_000): Promise<HTMLElement | null> {
  const deadline = performance.now() + timeoutMs
  for (;;) {
    const el = document.getElementById('print-root')
    if (el) return el
    if (performance.now() >= deadline) return null
    await nextFrame()
  }
}

/** 等待單張圖片載入完成（含失敗與逾時，避免卡住整個匯出流程） */
function waitForImage(img: HTMLImageElement, timeoutMs = 3_000): Promise<void> {
  if (img.complete) return Promise.resolve()
  return new Promise((resolve) => {
    const done = (): void => {
      img.removeEventListener('load', done)
      img.removeEventListener('error', done)
      clearTimeout(timer)
      resolve()
    }
    const timer = setTimeout(done, timeoutMs)
    img.addEventListener('load', done)
    img.addEventListener('error', done)
  })
}

/** 等待字型與所有圖片就緒，並確認瀏覽器已完成排版與繪製 */
async function waitForPrintAssets(root: HTMLElement | null): Promise<void> {
  try {
    await document.fonts?.ready
  } catch {
    // 字型載入失敗不影響匯出，忽略
  }
  const images = root ? Array.from(root.querySelectorAll('img')) : []
  await Promise.all(images.map((img) => waitForImage(img)))
  // 連續兩個 animation frame：確保排版與繪製都已完成
  await nextFrame()
  await nextFrame()
}

export async function exportPdf(): Promise<void> {
  const a = api()
  if (!a) return notAvailable()
  const s = useSchedStore.getState()
  const prev = s.view
  // 切換到預覽視圖，確保 CallsheetPrintView 已掛載
  s.setView('preview')
  // 等預覽內容（含字型與分鏡圖片）真正就緒後再輸出，避免匯出空白或半成品的 PDF
  const root = await waitForPrintRoot()
  await waitForPrintAssets(root)
  const res = await a.exportPdf({ suggestedName: s.doc.project.projectName })
  if (res.ok) s.showToast('info', `已匯出 PDF：${res.filePath}`)
  else if (!res.canceled) s.showToast('error', `匯出失敗：${res.error ?? '未知錯誤'}`)
  useSchedStore.getState().setView(prev === 'preview' ? 'preview' : prev)
}
