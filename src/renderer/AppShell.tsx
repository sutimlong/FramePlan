import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Printer } from 'lucide-react'
import { useProjectStore } from '@/store/useProjectStore'
import { exportPdf, newDocument, openFile, saveFile } from '@/lib/fileActions'
import { APP_VERSION } from '@/lib/defaults'
import { checkForUpdates, markSkippedVersion, type UpdateInfo } from '@/lib/updateCheck'
import { UpdateReminder } from './components/UpdateReminder'
import { Sidebar } from './components/layout/Sidebar'
import { TopBar } from './components/layout/TopBar'
import { DayBar } from './components/layout/DayBar'
import { ProjectView } from './components/project/ProjectView'
import { DayView } from './components/day/DayView'
import { NotesView } from './components/day/NotesView'
import { RundownList } from './components/rundown/RundownList'
import { CastList } from './components/cast/CastList'
import { CastDayCalls } from './components/cast/CastDayCalls'
import { CrewManager } from './components/crew/CrewManager'
import { TransportView } from './components/transport/TransportView'
import { CallsheetPrintView } from './components/print/CallsheetPrintView'

function CastPage() {
  return (
    <div className="view-grid">
      <CastList />
      <CastDayCalls />
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
  const [update, setUpdate] = useState<UpdateInfo | null>(null)

  useEffect(() => {
    const api = window.electronAPI
    if (!api) return
    const offs = [
      api.onMenuNew(() => void newDocument()),
      api.onMenuOpen(() => void openFile()),
      api.onMenuSave(() => void saveFile(false)),
      api.onMenuSaveAs(() => void saveFile(true)),
      api.onMenuExportPdf(() => void exportPdf()),
      // 主程序在關閉視窗前要求儲存：把存檔結果回報給主程序，決定是否關閉視窗
      api.onRequestSaveBeforeClose(() => {
        void (async () => {
          const saved = await saveFile(false)
          api.replySaveBeforeClose(saved)
        })()
      }),
    ]
    return () => offs.forEach((off) => off())
  }, [])

  // 啟動時檢查 GitHub 是否有新版本：每天最多偵測一次，已跳過的版本不再提醒
  useEffect(() => {
    void checkForUpdates(APP_VERSION).then((info) => {
      if (info) setUpdate(info)
    })
  }, [])

  useEffect(() => {
    window.electronAPI?.setDirty(dirty)
  }, [dirty])

  useEffect(() => {
    window.electronAPI?.setCurrentFile(filePath)
  }, [filePath])

  useEffect(() => {
    // 進行中提示（例如匯出 PDF 時的「QR code 製作中…」）不自動消失，
    // 由流程結束時主動清除或由後續提示取代，避免還在 上傳／產生 QR 時提示就先不見。
    if (!toast || toast.kind === 'progress') return
    const t = setTimeout(clearToast, 3500)
    return () => clearTimeout(t)
  }, [toast, clearToast])

  // 切換天數或載入新檔案時，用 key 強制重新掛載，Slate 編輯器才會載入正確內容
  const contentKey = `${loadCount}:${view}:${view === 'project' || view === 'cast' ? 'shared' : dayId}`

  // 前往下載：以系統預設瀏覽器開啟 GitHub 最新 release 頁面
  const openDownload = () => {
    if (update) void window.electronAPI?.openExternal(update.url)
    setUpdate(null)
  }

  // 跳過此版本：記錄後不再提醒同一版本（出現更新版本時仍會提醒）
  const skipVersion = () => {
    if (update) markSkippedVersion(update.tag)
    setUpdate(null)
  }

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
            {toast.kind === 'progress' && <Loader2 size={13} className="spin" />}
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
      {update && (
        <UpdateReminder
          info={update}
          onDownload={openDownload}
          onSkip={skipVersion}
          onClose={() => setUpdate(null)}
        />
      )}
    </div>
  )
}
