import { useRef } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import type { ImageAsset } from '@shared/schema'
import { uid } from '@/lib/utils'
import { useProjectStore } from '@/store/useProjectStore'

const MAX_SIDE = 1400

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

export function StoryboardPicker({ assetIds, onChange }: Props) {
  const assets = useProjectStore((s) => s.doc.assets)
  const addAsset = useProjectStore((s) => s.addAsset)
  const showToast = useProjectStore((s) => s.showToast)
  const inputRef = useRef<HTMLInputElement>(null)

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
              <div key={id} className="storyboard-thumb">
                {a && <img src={`data:${a.mime};base64,${a.dataBase64}`} alt="分鏡" />}
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
    </div>
  )
}
