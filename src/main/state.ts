import type { BrowserWindow } from 'electron'
import { appDisplayName } from './ipc/app'

export const appState: {
  win: BrowserWindow | null
  dirty: boolean
  currentFile: string | null
} = { win: null, dirty: false, currentFile: null }

export function refreshTitle(): void {
  const win = appState.win
  if (!win || win.isDestroyed()) return
  const name = appState.currentFile ? appState.currentFile.split('/').pop() : '未命名.sched'
  win.setTitle(`${name}${appState.dirty ? ' — 已編輯' : ''} · ${appDisplayName()}`)
  if (process.platform === 'darwin') {
    win.setDocumentEdited(appState.dirty)
    win.setRepresentedFilename(appState.currentFile ?? '')
  }
}
