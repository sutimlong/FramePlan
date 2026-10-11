import { BrowserWindow, dialog, ipcMain } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import { IPC } from '../../shared/ipc-channels'
import type { PdfExportOptions, PdfResult } from '../../shared/ipc-channels'

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
      // printToPDF 使用 print 媒體，僅顯示 CallsheetPrintView（見 print.css）
      const buf = await win.webContents.printToPDF({
        pageSize: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
      })
      await fs.writeFile(target, buf)
      return { ok: true, filePath: target }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    }
  })
}
