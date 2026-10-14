import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import type { ConfirmOptions } from '../../shared/ipc-channels'

/**
 * 應用程式顯示名稱的唯一來源：package.json 的 productName
 * （Electron 會優先採用 productName，找不到時才退回 name）。
 * 修改 package.json 的 productName 即可讓選單、視窗標題與側邊欄同步更新。
 */
export function appDisplayName(): string {
  return app.name
}

/** 以原生對話框顯示確認訊息；回傳 true 表示使用者按下「確定」 */
async function confirm(opts: ConfirmOptions | undefined, win: BrowserWindow | null): Promise<boolean> {
  const message =
    typeof opts?.message === 'string' && opts.message.trim() ? opts.message.trim() : '確定要繼續嗎？'
  const detail = typeof opts?.detail === 'string' && opts.detail.trim() ? opts.detail.trim() : undefined
  const confirmLabel = opts?.confirmLabel?.trim() || '確定'
  const cancelLabel = opts?.cancelLabel?.trim() || '取消'
  const options = {
    type: opts?.danger ? ('warning' as const) : ('question' as const),
    message,
    detail,
    buttons: [confirmLabel, cancelLabel],
    defaultId: 0,
    cancelId: 1,
    // noLink 可讓 Windows 保持按鈕順序（否則系統會自動調換確定／取消）
    noLink: true,
  }
  const res = win ? await dialog.showMessageBox(win, options) : await dialog.showMessageBox(options)
  return res.response === 0
}

export function registerAppIpc(): void {
  ipcMain.handle(IPC.appName, () => appDisplayName())
  ipcMain.handle(IPC.confirm, (e, opts?: ConfirmOptions) =>
    confirm(opts, BrowserWindow.fromWebContents(e.sender)),
  )
}
