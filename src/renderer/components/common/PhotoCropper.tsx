import { useCallback, useState } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { Camera, Trash2, X } from 'lucide-react'
import { motion } from 'framer-motion'
import type { ImageAsset } from '@shared/schema'
import { uid } from '@/lib/utils'
import { useProjectStore as useSchedStore } from '@/store/useProjectStore'

const OUT_SIZE = 512

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('無法讀取圖片'))
    img.src = src
  })
}

async function cropToBase64(src: string, area: Area): Promise<string> {
  const img = await loadImage(src)
  const canvas = document.createElement('canvas')
  canvas.width = OUT_SIZE
  canvas.height = OUT_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('無法建立畫布')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, OUT_SIZE, OUT_SIZE)
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, OUT_SIZE, OUT_SIZE)
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
  return dataUrl.replace(/^data:image\/jpeg;base64,/, '')
}

function CropDialog({ src, onCancel, onDone }: {
  src: string
  onCancel: () => void
  onDone: (base64: string) => void
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [area, setArea] = useState<Area | null>(null)
  const [busy, setBusy] = useState(false)

  const onComplete = useCallback((_: Area, px: Area) => setArea(px), [])

  const confirm = async () => {
    if (!area) return
    setBusy(true)
    try {
      onDone(await cropToBase64(src, area))
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="modal" initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }}>
        <header className="modal-head">
          <h3>裁切照片</h3>
          <button className="icon-btn" onClick={onCancel} aria-label="關閉">
            <X size={16} />
          </button>
        </header>
        <div className="crop-area">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onComplete}
          />
        </div>
        <label className="zoom-row">
          縮放
          <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
        </label>
        <footer className="modal-foot">
          <button className="btn" onClick={onCancel}>取消</button>
          <button className="btn primary" onClick={confirm} disabled={busy || !area}>
            確定
          </button>
        </footer>
      </motion.div>
    </motion.div>
  )
}

interface Props {
  assetId?: string
  onChange: (assetId: string | undefined) => void
}

export function PhotoCropper({ assetId, onChange }: Props) {
  const asset = useSchedStore((s) => (assetId ? s.doc.assets[assetId] : undefined))
  const addAsset = useSchedStore((s) => s.addAsset)
  const showToast = useSchedStore((s) => s.showToast)
  const [src, setSrc] = useState<string | null>(null)

  const pick = (file: File | undefined) => {
    if (!file) return
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      showToast('error', '僅支援 JPG、PNG、WebP 圖片')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setSrc(String(reader.result))
    reader.readAsDataURL(file)
  }

  const done = (base64: string) => {
    const a: ImageAsset = { id: uid(), mime: 'image/jpeg', dataBase64: base64 }
    addAsset(a)
    onChange(a.id)
    setSrc(null)
  }

  return (
    <div className="photo">
      <label className="photo-box" title="上傳照片">
        {asset ? (
          <img src={`data:${asset.mime};base64,${asset.dataBase64}`} alt="" />
        ) : (
          <Camera size={18} />
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(e) => {
            pick(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </label>
      {asset && (
        <button className="icon-btn" title="移除照片" onClick={() => onChange(undefined)}>
          <Trash2 size={13} />
        </button>
      )}
      {src && <CropDialog src={src} onCancel={() => setSrc(null)} onDone={done} />}
    </div>
  )
}
