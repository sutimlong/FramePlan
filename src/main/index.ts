import { app, BrowserWindow, dialog, session, shell } from 'electron'
import path from 'node:path'
import { appState, refreshTitle } from './state'
import { buildMenu } from './menu'
import { registerAppIpc } from './ipc/app'
import { registerFileIpc } from './ipc/file'
import { registerPdfIpc } from './ipc/pdf'
import { installBundledFonts } from './fonts'

const DEV_URL = process.env.VITE_DEV_SERVER_URL
const appRoot = path.join(import.meta.dirname, '..')

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#f4f4f1',
    webPreferences: {
      preload: path.join(appRoot, 'src/preload/preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  })
  appState.win = win

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) void shell.openExternal(url)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (e, url) => {
    if (DEV_URL && url.startsWith(DEV_URL)) return
    e.preventDefault()
  })

  let forceClose = false
  win.on('close', (e) => {
    if (forceClose || !appState.dirty) return
    e.preventDefault()
    const choice = dialog.showMessageBoxSync(win, {
      type: 'warning',
      message: '要儲存變更嗎？',
      detail: '如果不儲存，您的變更將會遺失。',
      buttons: ['不儲存', '取消'],
      defaultId: 1,
      cancelId: 1,
    })
    if (choice === 0) {
      forceClose = true
      win.close()
    }
  })
  win.on('closed', () => {
    appState.win = null
  })
  // 視窗標題一律由主程序決定（含應用程式名稱），避免被頁面的 <title> 覆蓋
  win.on('page-title-updated', (e) => {
    e.preventDefault()
    refreshTitle()
  })

  if (DEV_URL) void win.loadURL(DEV_URL)
  else void win.loadFile(path.join(appRoot, 'dist/index.html'))
  refreshTitle()
}

function applyCsp(): void {
  if (DEV_URL) return
  session.defaultSession.webRequest.onHeadersReceived((details, cb) => {
    cb({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
            'connect-src ' +
            "'self' " +
            'https://api.open-meteo.com https://archive-api.open-meteo.com ' +
            'https://api.sunrisesunset.io https://nominatim.openstreetmap.org; ' +
            "img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'",
        ],
      },
    })
  })
}

app.whenReady().then(() => {
  applyCsp()
  installBundledFonts()
  registerFileIpc()
  registerPdfIpc()
  registerAppIpc()
  buildMenu()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
