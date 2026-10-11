export const IPC = {
  save: 'sched:save',
  saveAs: 'sched:saveAs',
  open: 'sched:open',
  exportPdf: 'pdf:export',
  setDirty: 'app:setDirty',
  setCurrentFile: 'app:setCurrentFile',
  appName: 'app:getName',
  menuNew: 'menu:new',
  menuOpen: 'menu:open',
  menuSave: 'menu:save',
  menuSaveAs: 'menu:saveAs',
  menuExportPdf: 'menu:exportPdf',
  requestSnapshot: 'app:requestSnapshot',
  snapshotReply: 'app:snapshotReply',
} as const

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
