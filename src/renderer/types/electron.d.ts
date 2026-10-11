import type {
  OpenResult,
  PdfExportOptions,
  PdfResult,
  SaveRequest,
  SaveResult,
} from '@shared/ipc-channels'

export interface ElectronAPI {
  saveSchedFile(req: SaveRequest): Promise<SaveResult>
  saveSchedFileAs(req: Omit<SaveRequest, 'filePath'>): Promise<SaveResult>
  openSchedFile(): Promise<OpenResult>
  exportPdf(opts?: PdfExportOptions): Promise<PdfResult>
  getAppName(): Promise<string>
  onMenuNew(cb: () => void): () => void
  onMenuOpen(cb: () => void): () => void
  onMenuSave(cb: () => void): () => void
  onMenuSaveAs(cb: () => void): () => void
  onMenuExportPdf(cb: () => void): () => void
  setDirty(dirty: boolean): void
  setCurrentFile(path: string | null): void
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
