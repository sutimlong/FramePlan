import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ImagePlus, Trash2 } from 'lucide-react'
import type { ImageAsset } from '@shared/schema'
import { floatNearCursor, uid } from '@/lib/utils'
import { useProjectStore } from '@/store/useProjectStore'
import { StoryboardViewer } from './StoryboardViewer'

const MAX_SIDE = 1400

/** 浮動預覽與游標的間距（px，與 utils 的 floatNearCursor 預設值一致） */
const PREVIEW_GAP = 18

/** 讀取圖片並等比縮小到最長邊 MAX_SIDE，轉為 JPEG base64（不含 data URI 前綴） */
async function fileToAsset(file: File): Promise<ImageAsset> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('無法讀取圖片'))
    reader.readAsDataURL(file)
  })
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('無法載入圖片'))
    image.src = dataUrl
  })
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.max(1, Math.round(img.naturalWidth * scale))
  const h = Math.max(1, Math.round(img.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('無法建立畫布')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)
  return {
    id: uid(),
    mime: 'image/jpeg',
    dataBase64: canvas.toDataURL('image/jpeg', 0.85).replace(/^data:image\/jpeg;base64,/, ''),
  }
}

interface Props {
  assetIds: string[]
  onChange: (ids: string[]) => void
}

/**
 * 分鏡縮圖的浮動放大預覽。
 * 以 portal 掛到 document.body：行程表列的容器有 overflow: hidden，且頁面／列表帶有 framer-motion
 * 寫在 inline style 的 transform（會成為 fixed 的定位參考），直接掛在卡片內會被裁切或跟著位移。
 * 游標移動時只改 DOM 的 transform、不進 React state，避免每一格 mousemove 都重新渲染整列內容。
 */
function StoryboardHoverPreview({
  asset,
  x,
  y,
  onScroll,
}: {
  asset: ImageAsset
  /** 滑鼠進入縮圖當下的座標（後續位置由預覽自己追蹤游標） */
  x: number
  y: number
  /** 頁面捲動後縮圖已離開游標，直接關閉預覽 */
  onScroll: () => void
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const cursor = useRef({ x, y })

  const place = useCallback(() => {
    const el = ref.current
    if (!el) return
    const pos = floatNearCursor(
      cursor.current,
      { width: el.offsetWidth, height: el.offsetHeight },
      { width: window.innerWidth, height: window.innerHeight },
      PREVIEW_GAP,
    )
    el.style.transform = `translate(${pos.x}px, ${pos.y}px)`
  }, [])

  // 用 layout effect 在首次繪製前就定位，避免預覽先閃現在左上角
  useLayoutEffect(() => {
    place()
    const onMove = (e: MouseEvent) => {
      cursor.current = { x: e.clientX, y: e.clientY }
      place()
    }
    // scroll 事件不冒泡，須用 capture 攔截才收得到列表內部的捲動
    window.addEventListener('mousemove', onMove)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [place, onScroll])

  if (typeof document === 'undefined') return null
  return createPortal(
    <div ref={ref} className="sb-preview" style={{ transform: `translate(${x}px, ${y}px)` }}>
      {/* 圖片解碼後才有尺寸，載入完成再重算一次位置 */}
      <img src={`data:${asset.mime};base64,${asset.dataBase64}`} alt="" onLoad={place} />
    </div>,
    document.body,
  )
}

export function StoryboardPicker({ assetIds, onChange }: Props) {
  const assets = useProjectStore((s) => s.doc.assets)
  const addAsset = useProjectStore((s) => s.addAsset)
  const showToast = useProjectStore((s) => s.showToast)
  const inputRef = useRef<HTMLInputElement>(null)
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null)
  /** 以點擊縮圖開啟的大圖視窗所顯示的圖片 id */
  const [viewerId, setViewerId] = useState<string | null>(null)

  const closePreview = useCallback(() => setHover(null), [])
  const closeViewer = useCallback(() => setViewerId(null), [])
  // hover 的圖片若已不在清單中（移除圖片、切換場次）就不再顯示預覽
  const hoverAsset = hover && assetIds.includes(hover.id) ? assets[hover.id] : undefined
  // 大圖視窗同理：圖片被移除或切換場次時自動收起來
  const viewerAsset = viewerId && assetIds.includes(viewerId) ? assets[viewerId] : undefined

  const pick = async (file: File | undefined) => {
    if (!file) return
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      showToast('error', '僅支援 JPG、PNG、WebP 圖片')
      return
    }
    try {
      const asset = await fileToAsset(file)
      addAsset(asset)
      onChange([...assetIds, asset.id])
    } catch {
      showToast('error', '無法讀取圖片')
    }
  }

  return (
    <div className="storyboard">
      <div className="storyboard-head">
        <span className="field-label">分鏡</span>
        <button
          type="button"
          className="icon-btn"
          onClick={() => inputRef.current?.click()}
          title="加入分鏡圖片"
        >
          <ImagePlus size={16} />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(e) => {
            void pick(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>
      {assetIds.length === 0 ? (
        <span className="muted">尚未加入分鏡圖片</span>
      ) : (
        <div className="storyboard-thumbs">
          {assetIds.map((id) => {
            const a = assets[id]
            return (
              <div
                key={id}
                className="storyboard-thumb"
                onMouseEnter={(e) => {
                  if (a) setHover({ id, x: e.clientX, y: e.clientY })
                }}
                onMouseLeave={closePreview}
              >
                {a && (
                  <button
                    type="button"
                    className="storyboard-thumb-btn"
                    aria-label="放大檢視分鏡"
                    title="點擊放大檢視"
                    onClick={() => {
                      // 先收掉 hover 的小預覽，避免兩個預覽同時出現
                      setHover(null)
                      setViewerId(id)
                    }}
                  >
                    <img src={`data:${a.mime};base64,${a.dataBase64}`} alt="分鏡" />
                  </button>
                )}
                <button
                  type="button"
                  className="icon-btn danger"
                  title="移除分鏡圖片"
                  onClick={() => onChange(assetIds.filter((x) => x !== id))}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )
          })}
        </div>
      )}
      {hover && hoverAsset && (
        <StoryboardHoverPreview
          key={hover.id}
          asset={hoverAsset}
          x={hover.x}
          y={hover.y}
          onScroll={closePreview}
        />
      )}
      {viewerAsset && <StoryboardViewer asset={viewerAsset} onClose={closeViewer} />}
    </div>
  )
}
