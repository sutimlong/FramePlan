import QRCode from 'qrcode'
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

/** 等待尾頁的 QR code 圖片渲染並載入完成（React commit + data URL 載入） */
async function waitForQr(timeoutMs = 10_000): Promise<void> {
  const deadline = performance.now() + timeoutMs
  for (;;) {
    const img = document.querySelector<HTMLImageElement>('img.cs-qr')
    if (img?.complete) return
    if (performance.now() >= deadline) return
    await nextFrame()
  }
}

/**
 * 分享連結的來源說明：永久連結只寫服務名稱；臨時服務加上失效時間，
 * 讓使用者知道印在紙上的 QR code 什麼時候會失效。
 */
function shareLinkNote(providerLabel: string, expiresAt: string): string {
  const t = new Date(expiresAt)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${providerLabel}（連結有效至 ${t.getMonth() + 1}/${t.getDate()} ${pad(t.getHours())}:${pad(t.getMinutes())}）`
}

export async function exportPdf(): Promise<void> {
  const a = api()
  if (!a) return notAvailable()
  const s = useSchedStore.getState()
  const prev = s.view
  // 切換到預覽視圖，確保 CallsheetPrintView 已掛載
  s.setView('preview')
  s.setShareQr(null)
  // 等預覽內容（含字型與分鏡圖片）真正就緒後再輸出，避免匯出空白或半成品的 PDF
  await waitForPrintAssets(await waitForPrintRoot())

  // 上傳與產生 QR code 需要數秒（失敗時還要依序試備援服務），先顯示不會自動消失的
  // 進度提示，避免使用者以為按下匯出後沒有反應。
  s.showToast('progress', 'QR code 製作中…')

  // 第一次輸出：產生 PDF 並上傳到檔案代管服務，取得公開網址（不儲存檔案）
  let qrUrl: string | null = null
  let qrNote = ''
  try {
    const up = await a.uploadPdf({ suggestedName: s.doc.project.projectName })
    if (up.ok) {
      qrUrl = up.url
      qrNote = up.expiresAt ? shareLinkNote(up.providerLabel, up.expiresAt) : `${up.providerLabel}（永久連結）`
    } else {
      s.showToast('error', `無法取得分享連結，將匯出不含 QR 的版本（${up.error ?? '未知錯誤'}）`)
    }
  } catch (err) {
    s.showToast('error', `無法取得分享連結，將匯出不含 QR 的版本（${err instanceof Error ? err.message : '未知錯誤'}）`)
  }

  // 以公開網址產生 QR code，並重新渲染預覽（尾頁插入 QR）
  if (qrUrl) {
    try {
      const dataUrl = await QRCode.toDataURL(qrUrl, { width: 512, margin: 1 })
      s.setShareQr(dataUrl)
      await waitForQr()
      await waitForPrintAssets(document.getElementById('print-root'))
    } catch (err) {
      s.showToast('error', '產生 QR code 失敗，將匯出不含 QR 的版本')
      s.setShareQr(null)
      qrNote = ''
    }
  }

  // QR code 產生結束（成功或失敗）：清掉進度提示，避免它留在畫面上蓋掉之後的匯出結果。
  // 若上傳失敗，此時畫面上的已是錯誤提示，故只在仍為進度提示時才清除。
  const afterQr = useSchedStore.getState()
  if (afterQr.toast?.kind === 'progress') afterQr.clearToast()

  // 第二次輸出：此時畫面已含 QR 尾頁，進行存檔
  const res = await a.exportPdf({ suggestedName: s.doc.project.projectName })
  if (res.ok) s.showToast('info', `已匯出 PDF：${res.filePath}${qrNote ? `（含 QR：${qrNote}）` : ''}`)
  else if (!res.canceled) s.showToast('error', `匯出失敗：${res.error ?? '未知錯誤'}`)
  s.setShareQr(null)
  useSchedStore.getState().setView(prev === 'preview' ? 'preview' : prev)
}
