import { app, ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'

/**
 * 應用程式顯示名稱的唯一來源：package.json 的 productName
 * （Electron 會優先採用 productName，找不到時才退回 name）。
 * 修改 package.json 的 productName 即可讓選單、視窗標題與側邊欄同步更新。
 */
export function appDisplayName(): string {
  return app.name
}

export function registerAppIpc(): void {
  ipcMain.handle(IPC.appName, () => appDisplayName())
}
