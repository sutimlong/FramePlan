import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Printer } from 'lucide-react'
import { useProjectStore } from '@/store/useProjectStore'
import { exportPdf, newDocument, openFile, saveFile } from '@/lib/fileActions'
import { Sidebar } from './components/layout/Sidebar'
import { TopBar } from './components/layout/TopBar'
import { DayBar } from './components/layout/DayBar'
import { ProjectView } from './components/project/ProjectView'
import { DayView } from './components/day/DayView'
import { NotesView } from './components/day/NotesView'
import { RundownList } from './components/rundown/RundownList'
import { CastList } from './components/cast/CastList'
import { CastDayCalls } from './components/cast/CastDayCalls'
import { ExtrasCard } from './components/cast/ExtrasCard'
import { CrewManager } from './components/crew/CrewManager'
import { TransportView } from './components/transport/TransportView'
import { CallsheetPrintView } from './components/print/CallsheetPrintView'

function CastPage() {
  return (
    <div className="view-grid">
      <CastList />
      <CastDayCalls />
      <ExtrasCard />
    </div>
  )
}

function PreviewPage() {
  const scope = useProjectStore((s) => s.printScope)
  const setScope = useProjectStore((s) => s.setPrintScope)
  return (
    <>
      <div className="preview-bar">
        <Printer size={14} />
        <span>預覽與 PDF 範圍：</span>
        <button className={`chip ${scope === 'day' ? 'on' : ''}`} onClick={() => setScope('day')}>
          目前這天
        </button>
        <button className={`chip ${scope === 'all' ? 'on' : ''}`} onClick={() => setScope('all')}>
          全部天數
        </button>
      </div>
      <div className="preview-wrap">
        <CallsheetPrintView />
      </div>
    </>
  )
}

function CurrentView({ view }: { view: string }) {
  switch (view) {
    case 'project':
      return <ProjectView />
    case 'day':
      return <DayView />
    case 'rundown':
      return <RundownList />
    case 'cast':
      return <CastPage />
    case 'crew':
      return <CrewManager />
    case 'transport':
      return <TransportView />
    case 'notes':
      return <NotesView />
    default:
      return <PreviewPage />
  }
}

export default function AppShell() {
  const view = useProjectStore((s) => s.view)
  const dirty = useProjectStore((s) => s.dirty)
  const filePath = useProjectStore((s) => s.filePath)
  const dayId = useProjectStore((s) => s.currentDayId)
  const loadCount = useProjectStore((s) => s.loadCount)
  const toast = useProjectStore((s) => s.toast)
  const clearToast = useProjectStore((s) => s.clearToast)

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

  // 切換天數或載入新檔案時，用 key 強制重新掛載，Slate 編輯器才會載入正確內容
  const contentKey = `${loadCount}:${view}:${view === 'project' || view === 'cast' ? 'shared' : dayId}`

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <TopBar />
        <DayBar />
        <div className="content">
          <AnimatePresence mode="wait">
            <motion.div
              key={contentKey}
              className="view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16 }}
            >
              <CurrentView view={view} />
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
