import { Menu, app } from 'electron'
import type { MenuItemConstructorOptions } from 'electron'
import { IPC } from '../shared/ipc-channels'
import { appState } from './state'
import { appDisplayName } from './ipc/app'

const send = (channel: string) => () => {
  const w = appState.win
  if (w && !w.isDestroyed()) w.webContents.send(channel)
}

export function buildMenu(): void {
  const isMac = process.platform === 'darwin'
  const name = appDisplayName()
  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about', label: `關於 ${name}` },
              { type: 'separator' },
              { role: 'hide', label: '隱藏' },
              { role: 'hideOthers', label: '隱藏其他' },
              { role: 'unhide', label: '全部顯示' },
              { type: 'separator' },
              { role: 'quit', label: `結束 ${name}` },
            ],
          } as MenuItemConstructorOptions,
        ]
      : []),
    {
      label: '檔案',
      submenu: [
        { label: '新增', accelerator: 'CmdOrCtrl+N', click: send(IPC.menuNew) },
        { label: '開啟⋯', accelerator: 'CmdOrCtrl+O', click: send(IPC.menuOpen) },
        { type: 'separator' },
        { label: '儲存', accelerator: 'CmdOrCtrl+S', click: send(IPC.menuSave) },
        { label: '另存新檔⋯', accelerator: 'CmdOrCtrl+Shift+S', click: send(IPC.menuSaveAs) },
        { type: 'separator' },
        { label: '匯出 PDF⋯', accelerator: 'CmdOrCtrl+P', click: send(IPC.menuExportPdf) },
        { type: 'separator' },
        isMac ? { role: 'close', label: '關閉視窗' } : { role: 'quit', label: '結束' },
      ],
    },
    {
      label: '編輯',
      submenu: [
        { role: 'undo', label: '復原' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪下' },
        { role: 'copy', label: '拷貝' },
        { role: 'paste', label: '貼上' },
        { role: 'selectAll', label: '全選' },
      ],
    },
    {
      label: '檢視',
      submenu: [
        { role: 'reload', label: '重新載入' },
        { role: 'toggleDevTools', label: '開發者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '實際大小' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '縮小' },
        { role: 'togglefullscreen', label: '全螢幕' },
      ],
    },
    { label: '視窗', role: 'windowMenu' },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
