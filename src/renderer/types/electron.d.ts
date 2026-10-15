import type {
  ConfirmOptions,
  OpenResult,
  PdfExportOptions,
  PdfResult,
  SaveRequest,
  SaveResult,
  UploadResult,
} from '@shared/ipc-channels'

export interface ElectronAPI {
  saveSchedFile(req: SaveRequest): Promise<SaveResult>
  saveSchedFileAs(req: Omit<SaveRequest, 'filePath'>): Promise<SaveResult>
  openSchedFile(): Promise<OpenResult>
  exportPdf(opts?: PdfExportOptions): Promise<PdfResult>
  /** 將目前預覽畫面輸出成 PDF 並上傳到檔案代管服務，回傳公開網址（不儲存檔案） */
  uploadPdf(opts?: PdfExportOptions): Promise<UploadResult>
  getAppName(): Promise<string>
  /** 以主程序原生對話框顯示確認訊息 */
  confirm(opts: ConfirmOptions): Promise<boolean>
  onMenuNew(cb: () => void): () => void
  onMenuOpen(cb: () => void): () => void
  onMenuSave(cb: () => void): () => void
  onMenuSaveAs(cb: () => void): () => void
  onMenuExportPdf(cb: () => void): () => void
  /** 主程序在關閉視窗前要求儲存變更 */
  onRequestSaveBeforeClose(cb: () => void): () => void
  /** 回報關閉前的儲存結果；true 表示已儲存，可以關閉 */
  replySaveBeforeClose(saved: boolean): void
  setDirty(dirty: boolean): void
  setCurrentFile(path: string | null): void
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
