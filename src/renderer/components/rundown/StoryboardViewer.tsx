import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import type { ImageAsset } from '@shared/schema'

/**
 * 分鏡大圖視窗的本體（純呈現）。
 *
 * 獨立出來是為了能單獨測試：視窗以 portal 掛在 document.body，而 React 的伺服器渲染
 * 不支援 portal（會直接拋錯），因此測試只渲染這個本體、不渲染外面的 StoryboardViewer。
 *
 * 遮罩沿用通用的 .modal-backdrop（print.css 已把它排除在列印之外），內容是本檔的 .sb-viewer。
 */
export function StoryboardViewerBox({
  asset,
  onClose,
  closeRef,
}: {
  asset: ImageAsset
  onClose: () => void
  /** 由外層持有，掛在關閉鈕上，讓視窗開啟時能把焦點移進去 */
  closeRef: RefObject<HTMLButtonElement | null>
}) {
  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      {/* 點圖片本身不關閉，只有點到圖片外的遮罩才關閉 */}
      <div
        className="sb-viewer"
        role="dialog"
        aria-modal="true"
        aria-label="分鏡大圖"
        onClick={(e) => e.stopPropagation()}
      >
        <img src={`data:${asset.mime};base64,${asset.dataBase64}`} alt="分鏡" />
        <button
          ref={closeRef}
          type="button"
          className="icon-btn sb-viewer-close"
          onClick={onClose}
          aria-label="關閉"
          title="關閉（Esc）"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

/**
 * 點擊分鏡縮圖開啟的大圖視窗（hover 的小預覽仍由 StoryboardPicker 提供）。
 *
 * 以 portal 掛到 document.body：行程表列的容器有 overflow: hidden，且頁面／列表帶有
 * framer-motion 寫在 inline style 的 transform（會成為 fixed 的定位參考），
 * 直接掛在卡片內會被裁切或跟著位移。
 * 關閉方式：右上角按鈕、點背景、按 Esc；關閉後把焦點還給原本的縮圖按鈕。
 */
export function StoryboardViewer({ asset, onClose }: { asset: ImageAsset; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement | null>(null)
  /** 開啟這個視窗的元素（縮圖按鈕），關閉後把焦點還回去 */
  const openerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    // Electron（Chromium）點擊 button 會讓它取得焦點，所以這裡通常就是剛被點的縮圖按鈕
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      openerRef.current?.focus()
    }
  }, [onClose])

  if (typeof document === 'undefined') return null
  return createPortal(<StoryboardViewerBox asset={asset} onClose={onClose} closeRef={closeRef} />, document.body)
}
