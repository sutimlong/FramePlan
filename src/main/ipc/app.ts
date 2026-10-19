import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import type { CheckUpdateResult, ConfirmOptions } from '../../shared/ipc-channels'

/** GitHub 儲存庫（owner/repo），用於查詢最新 release */
const GITHUB_REPO = 'sutimlong/FramePlan'
/** GitHub API：最新 release（含 tag_name 與 html_url 下載頁） */
const GITHUB_LATEST_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`
/** 查詢逾時（毫秒）：網路異常時不可卡住應用程式啟動 */
const CHECK_TIMEOUT_MS = 10_000

/**
 * 應用程式顯示名稱的唯一來源：package.json 的 productName
 * （Electron 會優先採用 productName，找不到時才退回 name）。
 * 修改 package.json 的 productName 即可讓選單、視窗標題與側邊欄同步更新。
 */
export function appDisplayName(): string {
  return app.name
}

/**
 * 查詢 GitHub 最新 release 的 tag 與下載頁網址。
 * 僅回傳資料，版本新舊與否由渲染端判斷（渲染端才知道目前版本與使用者跳過的版本）。
 */
async function checkForUpdates(): Promise<CheckUpdateResult> {
  try {
    const res = await fetch(GITHUB_LATEST_URL, {
      headers: {
        Accept: 'application/vnd.github+json',
        // GitHub API 要求請求帶 User-Agent，否則會回 403
        'User-Agent': 'FramePlan',
      },
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
    })
    if (!res.ok) return { ok: false, error: `GitHub API ${res.status}` }
    const data = (await res.json()) as { tag_name?: unknown; html_url?: unknown }
    const tag = typeof data.tag_name === 'string' ? data.tag_name.trim() : ''
    if (!tag) return { ok: false, error: '無法解析最新版本標籤' }
    const url =
      typeof data.html_url === 'string' && data.html_url.trim()
        ? data.html_url.trim()
        : `https://github.com/${GITHUB_REPO}/releases/tag/${tag}`
    return { ok: true, tag, url }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
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
  ipcMain.handle(IPC.checkUpdate, () => checkForUpdates())
  ipcMain.handle(IPC.openExternal, (_e, url: unknown) => {
    const target = typeof url === 'string' ? url : ''
    if (/^https:\/\//.test(target)) void shell.openExternal(target)
  })
}
