import { app, BrowserWindow, dialog, ipcMain, session, shell } from 'electron'
import type { IpcMainEvent } from 'electron'
import path from 'node:path'
import { IPC } from '../shared/ipc-channels'
import { appState, refreshTitle } from './state'
import { buildMenu } from './menu'
import { registerAppIpc } from './ipc/app'
import { registerFileIpc } from './ipc/file'
import { registerPdfIpc } from './ipc/pdf'
import { installBundledFonts } from './fonts'

const DEV_URL = process.env.VITE_DEV_SERVER_URL
const appRoot = path.join(import.meta.dirname, '..')

/** 關閉視窗前等待渲染端存檔的上限；超過視為未儲存，維持視窗開啟 */
const SAVE_BEFORE_CLOSE_TIMEOUT_MS = 60_000

/**
 * 請渲染端執行存檔（與「檔案 → 儲存」相同流程），並等待其回報結果。
 * 渲染端若未回應（例如逾時），一律視為未儲存。
 */
function requestRendererSave(win: BrowserWindow): Promise<boolean> {
  return new Promise((resolve) => {
    const onResult = (_e: IpcMainEvent, saved: unknown): void => {
      clearTimeout(timer)
      ipcMain.removeListener(IPC.saveBeforeCloseResult, onResult)
      resolve(saved === true)
    }
    const timer = setTimeout(() => {
      ipcMain.removeListener(IPC.saveBeforeCloseResult, onResult)
      resolve(false)
    }, SAVE_BEFORE_CLOSE_TIMEOUT_MS)
    ipcMain.on(IPC.saveBeforeCloseResult, onResult)
    win.webContents.send(IPC.requestSaveBeforeClose)
  })
}

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
  let savingBeforeClose = false
  win.on('close', (e) => {
    if (forceClose || !appState.dirty) return
    e.preventDefault()
    if (savingBeforeClose) return
    const choice = dialog.showMessageBoxSync(win, {
      type: 'warning',
      message: '要儲存變更嗎？',
      detail: '如果不儲存，您的變更將會遺失。',
      buttons: ['儲存', '不儲存', '取消'],
      defaultId: 0,
      cancelId: 2,
      noLink: true,
    })
    if (choice === 2) return
    if (choice === 1) {
      forceClose = true
      win.close()
      return
    }
    // 選擇「儲存」：先請渲染端存檔，成功後才真正關閉視窗；
    // 若使用者取消了儲存對話框，視窗維持開啟，避免變更遺失。
    savingBeforeClose = true
    void requestRendererSave(win).then((saved) => {
      savingBeforeClose = false
      if (saved) {
        forceClose = true
        win.close()
      }
    })
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

/** 允許連線的外部資料來源（天氣與地理編碼 API） */
const API_ORIGINS =
  'https://api.open-meteo.com https://archive-api.open-meteo.com ' +
  'https://api.sunrisesunset.io https://nominatim.openstreetmap.org'

/**
 * Content-Security-Policy。
 * 正式版套用嚴格政策；開發模式另外放行 Vite dev server 與 HMR
 * （react-refresh 需要 inline script，HMR 需要 websocket）。
 */
function contentSecurityPolicy(devUrl?: string): string {
  if (!devUrl) {
    return (
      "default-src 'self'; " +
      `connect-src 'self' ${API_ORIGINS}; ` +
      "img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'"
    )
  }
  const httpOrigin = ` ${devUrl}`
  const wsOrigin = ` ${devUrl.replace(/^http/, 'ws')}`
  return (
    `default-src 'self'${httpOrigin}; ` +
    `connect-src 'self'${httpOrigin}${wsOrigin} ws://localhost:* ws://127.0.0.1:* ${API_ORIGINS}; ` +
    "img-src 'self' data: blob:; " +
    "style-src 'self' 'unsafe-inline'; " +
    `script-src 'self' 'unsafe-inline' 'unsafe-eval'${httpOrigin}`
  )
}

function applyCsp(): void {
  const policy = contentSecurityPolicy(DEV_URL)
  session.defaultSession.webRequest.onHeadersReceived((details, cb) => {
    cb({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [policy],
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
