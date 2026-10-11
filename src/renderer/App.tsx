import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSchedStore } from '@/store/useSchedStore'
import { exportPdf, newDocument, openFile, saveFile } from '@/lib/fileActions'
import { Sidebar } from './components/layout/Sidebar'
import { Toolbar } from './components/layout/Toolbar'
import { GeneralView } from './components/general/GeneralView'
import { NotesView } from './components/general/NotesView'
import { RundownView } from './components/rundown/RundownView'
import { CastView } from './components/cast/CastView'
import { CrewView } from './components/crew/CrewView'
import { CallsheetPrintView } from './components/print/CallsheetPrintView'

function CurrentView() {
  const view = useSchedStore((s) => s.view)
  switch (view) {
    case 'general':
      return <GeneralView />
    case 'rundown':
      return <RundownView />
    case 'cast':
      return <CastView />
    case 'crew':
      return <CrewView />
    case 'notes':
      return <NotesView />
    case 'preview':
      return null
  }
}

export default function App() {
  const view = useSchedStore((s) => s.view)
  const dirty = useSchedStore((s) => s.dirty)
  const filePath = useSchedStore((s) => s.filePath)
  const toast = useSchedStore((s) => s.toast)
  const clearToast = useSchedStore((s) => s.clearToast)

  useEffect(() => {
    const api = window.electronAPI
    if (!api) return
    const offs = [
      api.onMenuNew(newDocument),
      api.onMenuOpen(() => void openFile()),
      api.onMenuSave(() => void saveFile(false)),
      api.onMenuSaveAs(() => void saveFile(true)),
      api.onMenuExportPdf(() => void exportPdf()),
    ]
    return () => offs.forEach((off) => off())
  }, [])

  useEffect(() => {
    window.electronAPI?.setDirty(dirty)
  }, [dirty])

  useEffect(() => {
    window.electronAPI?.setCurrentFile(filePath)
  }, [filePath])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(clearToast, 3500)
    return () => clearTimeout(t)
  }, [toast, clearToast])

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Toolbar />
        <div className="content">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              className="view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16 }}
            >
              <CurrentView />
              {view === 'preview' && (
                <div className="preview-wrap">
                  <CallsheetPrintView />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`toast ${toast.kind}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            onClick={clearToast}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
