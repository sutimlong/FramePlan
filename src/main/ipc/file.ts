import { dialog, ipcMain, BrowserWindow } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import { IPC } from '../../shared/ipc-channels'
import type { OpenResult, SaveRequest, SaveResult } from '../../shared/ipc-channels'
import { appState, refreshTitle } from '../state'

const EXT = '.sched'
const FILTERS = [{ name: 'Callsheet Schedule', extensions: ['sched'] }]
const MAX_BYTES = 200 * 1024 * 1024

function ensureSchedExt(p: string): string {
  return path.extname(p).toLowerCase() === EXT ? p : p + EXT
}

/**
 * 以「先寫暫存檔、再更名」的方式寫入，避免寫到一半中斷而損毀原檔。
 * Windows 的 rename 無法覆蓋既有檔案，因此需要先刪除目標（此步驟非原子，
 * 但可避免因檔案已存在而直接失敗）；任何失敗都會清掉暫存檔。
 */
async function atomicWrite(filePath: string, content: string): Promise<void> {
  const tmp = `${filePath}.${process.pid}.tmp`
  try {
    await fs.writeFile(tmp, content, 'utf8')
    if (process.platform === 'win32') await fs.rm(filePath, { force: true })
    await fs.rename(tmp, filePath)
  } catch (e) {
    await fs.rm(tmp, { force: true }).catch(() => {})
    throw e
  }
}

function sanitizeName(name: unknown): string {
  const base = typeof name === 'string' && name.trim() ? name.trim() : '未命名通告表'
  return base.replace(/[\\/:*?"<>|]/g, '_')
}

async function doSave(
  win: BrowserWindow | null,
  req: SaveRequest,
  forceDialog: boolean,
): Promise<SaveResult> {
  try {
    if (!req || typeof req !== 'object' || req.data === undefined) {
      return { ok: false, error: '無效的儲存請求' }
    }
    let target: string | null = null
    if (!forceDialog && typeof req.filePath === 'string' && req.filePath) {
      if (path.extname(req.filePath).toLowerCase() !== EXT || !path.isAbsolute(req.filePath)) {
        return { ok: false, error: '只允許儲存為 .sched 檔案' }
      }
      target = req.filePath
    } else {
      const opts = {
        title: '儲存通告表',
        defaultPath: sanitizeName(req.suggestedName) + EXT,
        filters: FILTERS,
        properties: ['createDirectory' as const, 'showOverwriteConfirmation' as const],
      }
      const res = win ? await dialog.showSaveDialog(win, opts) : await dialog.showSaveDialog(opts)
      if (res.canceled || !res.filePath) return { ok: false, canceled: true }
      target = ensureSchedExt(res.filePath)
    }
    await atomicWrite(target, JSON.stringify(req.data, null, 2))
    appState.currentFile = target
    refreshTitle()
    return { ok: true, filePath: target }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function openViaDialog(win: BrowserWindow | null): Promise<OpenResult> {
  try {
    const opts = {
      title: '開啟通告表',
      filters: FILTERS,
      properties: ['openFile' as const],
    }
    const res = win ? await dialog.showOpenDialog(win, opts) : await dialog.showOpenDialog(opts)
    if (res.canceled || res.filePaths.length === 0) return { ok: false, canceled: true }
    return await readSched(res.filePaths[0])
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function readSched(filePath: string): Promise<OpenResult> {
  try {
    if (path.extname(filePath).toLowerCase() !== EXT) {
      return { ok: false, error: '僅支援 .sched 檔案' }
    }
    const stat = await fs.stat(filePath)
    if (stat.size > MAX_BYTES) return { ok: false, error: '檔案過大' }
    const text = await fs.readFile(filePath, 'utf8')
    const data: unknown = JSON.parse(text)
    appState.currentFile = filePath
    refreshTitle()
    return { ok: true, filePath, data }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? `無法讀取檔案：${e.message}` : String(e) }
  }
}

export function registerFileIpc(): void {
  ipcMain.handle(IPC.save, (e, req: SaveRequest) =>
    doSave(BrowserWindow.fromWebContents(e.sender), req, false),
  )
  ipcMain.handle(IPC.saveAs, (e, req: SaveRequest) =>
    doSave(BrowserWindow.fromWebContents(e.sender), req, true),
  )
  ipcMain.handle(IPC.open, (e) => openViaDialog(BrowserWindow.fromWebContents(e.sender)))
  ipcMain.on(IPC.setDirty, (_e, dirty: unknown) => {
    appState.dirty = dirty === true
    refreshTitle()
  })
  ipcMain.on(IPC.setCurrentFile, (_e, p: unknown) => {
    appState.currentFile = typeof p === 'string' ? p : null
    refreshTitle()
  })
}
