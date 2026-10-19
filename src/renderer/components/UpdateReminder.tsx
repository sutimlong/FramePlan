import { useEffect } from 'react'
import { X } from 'lucide-react'
import type { UpdateInfo } from '@/lib/updateCheck'

/**
 * 有新版本時的提醒視窗。
 * 遮罩與對話框沿用共用樣式（.modal-backdrop／.modal，print.css 已排除列印），
 * 兩個主要動作：前往 GitHub 下載頁、跳過此版本（之後同一版本不再提醒）。
 */
export function UpdateReminder({
  info,
  onDownload,
  onSkip,
  onClose,
}: {
  info: UpdateInfo
  onDownload: () => void
  onSkip: () => void
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="發現新版本"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h3>發現新版本</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="稍後" title="稍後">
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">
          <p>
            目前使用的是 <strong>v{info.currentVersion}</strong>，GitHub 上已有新版本{' '}
            <strong>{info.tag}</strong>。
          </p>
          <p>建議前往下載最新版本，以取得新功能與問題修正。</p>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn" onClick={onSkip}>
            跳過此版本
          </button>
          <button type="button" className="btn primary" onClick={onDownload}>
            前往下載
          </button>
        </div>
      </div>
    </div>
  )
}
