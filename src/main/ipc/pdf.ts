import { BrowserWindow, dialog, ipcMain } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import { IPC } from '../../shared/ipc-channels'
import type { PdfExportOptions, PdfResult, UploadResult } from '../../shared/ipc-channels'

/** 0.5 公分留白（左右與上緣） */
const SIDE_MARGIN_INCH = 0.5 / 2.54

/**
 * 頁面下緣留白（0.8 公分）：必須大於頁碼文字高度，否則頁碼會與內容重疊。
 * print.css 的 @page 也使用相同數值，避免 CSS 邊界與此處設定不一致。
 */
const BOTTOM_MARGIN_INCH = 0.8 / 2.54

/**
 * 頁碼：置於每頁正下方置中，格式為「第 X 頁，共 Y 頁」。
 * pageNumber / totalPages 由 Chromium 於列印時代入實際頁碼與總頁數。
 * 模板在獨立環境中繪製，只能使用行內樣式。
 */
const FOOTER_TEMPLATE =
  '<div style="width:100%;text-align:center;font-size:8px;color:#000;' +
  "font-family:-apple-system,'PingFang TC','Heiti TC','Microsoft JhengHei',sans-serif\">" +
  '第 <span class="pageNumber"></span> 頁，共 <span class="totalPages"></span> 頁</div>'

/** 空的上緣模板：關閉 Chromium 預設的標題／網址頁首（若留空字串會顯示預設頁首） */
const EMPTY_HEADER_TEMPLATE = '<div></div>'

/** Catbox 檔案上傳 API（匿名上傳：不帶 userhash），成功時回傳公開網址純文字 */
const CATBOX_UPLOAD_URL = 'https://catbox.moe/user/api.php'
/** Litterbox：Catbox 的臨時空間，成功時回傳公開網址純文字，最多保留 72 小時 */
const LITTERBOX_UPLOAD_URL = 'https://litterbox.catbox.moe/resources/internals/api.php'
/** temp.sh：臨時空間，成功時回傳下載頁網址純文字，保留 3 天 */
const TEMP_SH_UPLOAD_URL = 'https://temp.sh/upload'
/** 單一上傳服務的逾時（毫秒）：服務無回應時不可卡住整個匯出流程 */
const UPLOAD_TIMEOUT_MS = 20_000
const HOUR_MS = 3_600_000

/**
 * 以目前的列印樣式（print.css）將預覽畫面輸出成 PDF 位元組。
 * printToPDF 使用 print 媒體，僅顯示 CallsheetPrintView（見 print.css）。
 */
async function renderPdfBuffer(win: BrowserWindow): Promise<Buffer> {
  return win.webContents.printToPDF({
    pageSize: 'A4',
    landscape: true,
    printBackground: true,
    preferCSSPageSize: true,
    margins: {
      top: SIDE_MARGIN_INCH,
      bottom: BOTTOM_MARGIN_INCH,
      left: SIDE_MARGIN_INCH,
      right: SIDE_MARGIN_INCH,
    },
    // 每一頁下緣置中顯示「第 X 頁，共 Y 頁」
    displayHeaderFooter: true,
    headerTemplate: EMPTY_HEADER_TEMPLATE,
    footerTemplate: FOOTER_TEMPLATE,
  })
}

/** 上傳服務鏈的成員：`expiresInMs` 為 null 表示連結永久有效 */
interface UploadProvider {
  label: string
  expiresInMs: number | null
  upload: (buf: Buffer, filename: string) => Promise<string>
}

/** PDF 上傳用的 multipart 表單（各服務的檔案欄位名稱不同，故以參數指定） */
function pdfForm(field: string, buf: Buffer, filename: string): FormData {
  const form = new FormData()
  // Buffer 需複製成獨立 Uint8Array（ArrayBuffer），才能作為 Blob 內容
  form.append(field, new Blob([new Uint8Array(buf)], { type: 'application/pdf' }), filename)
  return form
}

/**
 * 解析上傳服務的純文字回應：成功時服務會直接回傳公開網址；
 * 若為 HTML 錯誤頁或服務錯誤訊息則視為失敗，並帶回原因供使用者判斷。
 */
function parseUploadUrl(text: string, status: number): string {
  const body = text.trim()
  if (/^https?:\/\/\S+$/.test(body)) return body
  if (!body || body.startsWith('<')) throw new Error(`HTTP ${status}`)
  throw new Error(body.slice(0, 80))
}

/** Catbox：匿名上傳，連結永久有效 */
async function uploadToCatbox(buf: Buffer, filename: string): Promise<string> {
  const form = pdfForm('fileToUpload', buf, filename)
  form.append('reqtype', 'fileupload')
  const res = await fetch(CATBOX_UPLOAD_URL, {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
  })
  return parseUploadUrl(await res.text(), res.status)
}

/** Litterbox（Catbox 的臨時空間）：保留 72 小時 */
async function uploadToLitterbox(buf: Buffer, filename: string): Promise<string> {
  const form = pdfForm('fileToUpload', buf, filename)
  form.append('reqtype', 'fileupload')
  form.append('time', '72h')
  const res = await fetch(LITTERBOX_UPLOAD_URL, {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
  })
  return parseUploadUrl(await res.text(), res.status)
}

/** temp.sh：保留 3 天；回傳的是下載頁網址（掃描後需再點一次下載） */
async function uploadToTempSh(buf: Buffer, filename: string): Promise<string> {
  const form = pdfForm('file', buf, filename)
  const res = await fetch(TEMP_SH_UPLOAD_URL, {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
  })
  return parseUploadUrl(await res.text(), res.status)
}

/** 上傳服務鏈：永久連結的 Catbox 優先，失敗時依序改用臨時服務（連結會失效） */
const UPLOAD_PROVIDERS: UploadProvider[] = [
  { label: 'Catbox', expiresInMs: null, upload: uploadToCatbox },
  { label: 'Litterbox', expiresInMs: 72 * HOUR_MS, upload: uploadToLitterbox },
  { label: 'temp.sh', expiresInMs: 3 * 24 * HOUR_MS, upload: uploadToTempSh },
]

/**
 * 依序嘗試各上傳服務，回傳第一個成功的連結資訊。
 * 全部失敗時丟出錯誤，訊息包含各服務的失敗原因，方便使用者判斷是服務停機還是網路問題。
 */
async function uploadPdfBuffer(
  buf: Buffer,
  filename: string,
): Promise<{ url: string; providerLabel: string; expiresAt: string | null }> {
  const failures: string[] = []
  for (const provider of UPLOAD_PROVIDERS) {
    try {
      const url = await provider.upload(buf, filename)
      return {
        url,
        providerLabel: provider.label,
        expiresAt: provider.expiresInMs === null ? null : new Date(Date.now() + provider.expiresInMs).toISOString(),
      }
    } catch (err) {
      failures.push(`${provider.label}：${err instanceof Error ? err.message : String(err)}`)
    }
  }
  throw new Error(failures.join('；'))
}

export function registerPdfIpc(): void {
  ipcMain.handle(IPC.exportPdf, async (e, opts?: PdfExportOptions): Promise<PdfResult> => {
    try {
      const win = BrowserWindow.fromWebContents(e.sender)
      if (!win) return { ok: false, error: '找不到視窗' }
      const base =
        typeof opts?.suggestedName === 'string' && opts.suggestedName.trim()
          ? opts.suggestedName.trim().replace(/[\\/:*?"<>|]/g, '_')
          : '通告表'
      const res = await dialog.showSaveDialog(win, {
        title: '匯出 PDF',
        defaultPath: `${base}.pdf`,
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
        properties: ['createDirectory', 'showOverwriteConfirmation'],
      })
      if (res.canceled || !res.filePath) return { ok: false, canceled: true }
      const target = path.extname(res.filePath).toLowerCase() === '.pdf' ? res.filePath : res.filePath + '.pdf'
      // 將視窗底色設為純白色，確保 PDF 留白邊緣為純白紙張顏色
      win.setBackgroundColor('#ffffff')
      const buf = await renderPdfBuffer(win)
      win.setBackgroundColor('#f4f4f1')
      await fs.writeFile(target, buf)
      return { ok: true, filePath: target }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  // 匯出前先產生 PDF 並上傳到 Catbox，取得公開網址以產生分享 QR code（不儲存檔案）
  ipcMain.handle(IPC.uploadPdf, async (e): Promise<UploadResult> => {
    try {
      const win = BrowserWindow.fromWebContents(e.sender)
      if (!win) return { ok: false, error: '找不到視窗' }
      // 將視窗底色設為純白色，確保 PDF 留白邊緣為純白紙張顏色
      win.setBackgroundColor('#ffffff')
      const buf = await renderPdfBuffer(win)
      win.setBackgroundColor('#f4f4f1')
      const link = await uploadPdfBuffer(buf, `通告表-${Date.now()}.pdf`)
      return { ok: true, ...link }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    }
  })
}
