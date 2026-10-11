const { contextBridge, ipcRenderer } = require('electron')

const on = (channel, cb) => {
  const listener = () => cb()
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

contextBridge.exposeInMainWorld('electronAPI', {
  saveSchedFile: (req) => ipcRenderer.invoke('sched:save', req),
  saveSchedFileAs: (req) => ipcRenderer.invoke('sched:saveAs', req),
  openSchedFile: () => ipcRenderer.invoke('sched:open'),
  exportPdf: (opts) => ipcRenderer.invoke('pdf:export', opts),
  getAppName: () => ipcRenderer.invoke('app:getName'),

  onMenuNew: (cb) => on('menu:new', cb),
  onMenuOpen: (cb) => on('menu:open', cb),
  onMenuSave: (cb) => on('menu:save', cb),
  onMenuSaveAs: (cb) => on('menu:saveAs', cb),
  onMenuExportPdf: (cb) => on('menu:exportPdf', cb),

  setDirty: (dirty) => ipcRenderer.send('app:setDirty', !!dirty),
  setCurrentFile: (filePath) =>
    ipcRenderer.send('app:setCurrentFile', typeof filePath === 'string' ? filePath : null),
})
