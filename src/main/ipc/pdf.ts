import { BrowserWindow, dialog, ipcMain } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import { IPC } from '../../shared/ipc-channels'
import type { PdfExportOptions, PdfResult } from '../../shared/ipc-channels'

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
      // printToPDF 使用 print 媒體，僅顯示 CallsheetPrintView（見 print.css）
      const buf = await win.webContents.printToPDF({
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
      win.setBackgroundColor('#f4f4f1')
      await fs.writeFile(target, buf)
      return { ok: true, filePath: target }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    }
  })
}
