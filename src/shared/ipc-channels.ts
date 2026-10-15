export const IPC = {
  save: 'sched:save',
  saveAs: 'sched:saveAs',
  open: 'sched:open',
  exportPdf: 'pdf:export',
  uploadPdf: 'pdf:upload',
  setDirty: 'app:setDirty',
  setCurrentFile: 'app:setCurrentFile',
  appName: 'app:getName',
  /** 主程序 → 渲染端：關閉視窗之前要求儲存尚未儲存的變更 */
  requestSaveBeforeClose: 'app:requestSaveBeforeClose',
  /** 渲染端 → 主程序：回報儲存結果（true 表示已儲存，可以關閉視窗） */
  saveBeforeCloseResult: 'app:saveBeforeCloseResult',
  /** 渲染端 → 主程序：以原生對話框顯示確認訊息 */
  confirm: 'app:confirm',
  menuNew: 'menu:new',
  menuOpen: 'menu:open',
  menuSave: 'menu:save',
  menuSaveAs: 'menu:saveAs',
  menuExportPdf: 'menu:exportPdf',
} as const

/** 原生確認對話框的參數（對應 Electron 的 dialog.showMessageBox） */
export interface ConfirmOptions {
  message: string
  detail?: string
  /** 確定按鈕的文字，預設「確定」 */
  confirmLabel?: string
  /** 取消按鈕的文字，預設「取消」 */
  cancelLabel?: string
  /** 破壞性操作（例如刪除）時使用警告樣式 */
  danger?: boolean
}

export interface SaveRequest {
  data: unknown
  filePath?: string | null
  suggestedName?: string
}
export type SaveResult =
  | { ok: true; filePath: string }
  | { ok: false; canceled?: boolean; error?: string }

export type OpenResult =
  | { ok: true; filePath: string; data: unknown }
  | { ok: false; canceled?: boolean; error?: string }

export interface PdfExportOptions {
  suggestedName?: string
}
export type PdfResult =
  | { ok: true; filePath: string }
  | { ok: false; canceled?: boolean; error?: string }

/**
 * 將 PDF 上傳到檔案代管服務的結果。
 * 成功時帶回公開網址、服務名稱與連結失效時間（永久連結為 null），
 * 供產生分享 QR code 與提示使用者連結何時失效。
 */
export type UploadResult =
  | { ok: true; url: string; providerLabel: string; expiresAt: string | null }
  | { ok: false; error?: string }
