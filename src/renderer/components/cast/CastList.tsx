import { Plus, Trash2, Upload } from 'lucide-react'
import { useProjectStore } from '@/store/useProjectStore'
import { Card, TextField } from '../common/Fields'
import { PhotoCropper } from '../common/PhotoCropper'
import { confirmAction } from '@/lib/confirm'
import { uid } from '@/lib/utils'
import type { CastMember, ImageAsset } from '@shared/schema'

type ImageMime = ImageAsset['mime']

/** 判斷圖片格式：優先採用標示的 mime，否則由 base64 檔頭推斷 */
function sniffMime(dataBase64: string, declared?: string): ImageMime {
  if (declared === 'image/png' || declared === 'image/webp' || declared === 'image/jpeg') return declared
  if (dataBase64.startsWith('iVBORw0KGgo')) return 'image/png'
  if (dataBase64.startsWith('UklGR')) return 'image/webp'
  return 'image/jpeg'
}

function bytesToBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

/**
 * 把 .cast 內的圖片欄位轉成圖片資產。
 * 支援 data URI（依其標示的格式）與遠端圖片網址（下載後轉 base64）；
 * 認不出來的內容回傳 null，避免塞入錯誤的 base64 而變成破圖。
 */
async function toImageAsset(value: string): Promise<ImageAsset | null> {
  const raw = value.replace(/\s+/g, '')
  if (!raw) return null

  const dataUri = raw.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/i)
  if (dataUri) {
    const dataBase64 = dataUri[2]
    return { id: uid(), mime: sniffMime(dataBase64, dataUri[1].toLowerCase()), dataBase64 }
  }

  if (/^https?:\/\//i.test(raw)) {
    const res = await fetch(raw)
    if (!res.ok) throw new Error(`無法下載圖片（${res.status}）`)
    const blob = await res.blob()
    const dataBase64 = bytesToBase64(new Uint8Array(await blob.arrayBuffer()))
    return { id: uid(), mime: sniffMime(dataBase64, blob.type), dataBase64 }
  }

  // 沒有 data URI 前綴的裸 base64（早期 .cast 檔的格式）
  if (raw.length >= 32 && /^[A-Za-z0-9+/]+={0,2}$/.test(raw)) {
    return { id: uid(), mime: sniffMime(raw), dataBase64: raw }
  }
  return null
}

/** 取出單筆資料中第一個有值的字串欄位 */
function pickString(item: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = item[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

/** .cast 可能是陣列，或把名單放在 cast / actors / data 欄位裡 */
function pickCastList(data: unknown): Array<Record<string, unknown>> {
  const candidates: unknown[] = Array.isArray(data)
    ? [data]
    : data && typeof data === 'object'
      ? [
          (data as Record<string, unknown>).cast,
          (data as Record<string, unknown>).actors,
          (data as Record<string, unknown>).data,
        ]
      : []
  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue
    const items = candidate.filter(
      (x): x is Record<string, unknown> => typeof x === 'object' && x !== null,
    )
    if (items.length > 0) return items
  }
  return []
}

/** 共用演員名單：新增後，每一天都可以在「本日出勤」裡選用 */
export function CastList() {
  const cast = useProjectStore((s) => s.doc.cast)
  const st = useProjectStore.getState

  const handleImportCast = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const reader = new FileReader()
    reader.onerror = () => st().showToast('error', '讀取 .cast 檔案失敗')
    reader.onload = async () => {
      let list: Array<Record<string, unknown>>
      try {
        list = pickCastList(JSON.parse(String(reader.result)))
      } catch {
        st().showToast('error', '無法解析 .cast 檔案格式，請確認是否為有效的 JSON。')
        return
      }
      if (list.length === 0) {
        st().showToast('error', '找不到可匯入的演員資料')
        return
      }

      const newCasts: Array<Partial<CastMember>> = []
      let failedPhotos = 0
      for (const item of list) {
        let photoAssetId: string | undefined
        const photoData = pickString(item, [
          'standardPhotoUrl',
          'photo',
          'photoBase64',
          'image',
          'photoData',
        ])
        if (photoData) {
          try {
            const asset = await toImageAsset(photoData)
            if (asset) {
              st().addAsset(asset)
              photoAssetId = asset.id
            } else {
              failedPhotos += 1
            }
          } catch {
            // 單張照片下載／轉換失敗不應中斷整批匯入
            failedPhotos += 1
          }
        }

        newCasts.push({
          characterName: pickString(item, ['name', 'characterName', 'role', 'character']),
          actorName: pickString(item, ['realName', 'actorName']),
          phone: pickString(item, ['contactPhone', 'phone', 'phoneNumber']),
          email: pickString(item, ['email']),
          photoAssetId,
        })
      }

      st().addCasts(newCasts)
      st().showToast(
        'info',
        failedPhotos > 0
          ? `成功匯入 ${newCasts.length} 位演員（${failedPhotos} 張照片無法匯入）`
          : `成功匯入 ${newCasts.length} 位演員`,
      )
    }
    reader.readAsText(file)
  }

  return (
    <Card
      title="演員名單（所有天共用）"
      actions={
        <div style={{ display: 'flex', gap: '8px' }}>
          <label className="btn small outline" style={{ cursor: 'pointer' }}>
            <Upload size={14} /> 從.cast新增
            <input type="file" accept=".cast" hidden onChange={handleImportCast} />
          </label>
          <button className="btn small primary" onClick={() => st().addCast()}>
            <Plus size={14} /> 新增演員
          </button>
        </div>
      }
    >
      {cast.length === 0 && <p className="empty">尚未新增演員。</p>}
      {cast.map((c) => (
        <div className="row-inline" key={c.id}>
          <PhotoCropper assetId={c.photoAssetId} onChange={(id) => st().updateCast(c.id, { photoAssetId: id })} />
          <span className="badge">{c.number}</span>
          <TextField label="角色名稱" value={c.characterName} onChange={(v) => st().updateCast(c.id, { characterName: v })} />
          <TextField label="演員姓名" value={c.actorName} onChange={(v) => st().updateCast(c.id, { actorName: v })} />
          <TextField label="電話" value={c.phone ?? ''} onChange={(v) => st().updateCast(c.id, { phone: v })} />
          <TextField label="Email" value={c.email ?? ''} onChange={(v) => st().updateCast(c.id, { email: v })} />
          <button
            className="icon-btn danger"
            title="刪除演員（所有天的出勤紀錄一併移除）"
            onClick={async () => {
              const name = c.characterName || c.actorName || '未命名'
              const ok = await confirmAction({
                message: `刪除「${name}」？`,
                detail: '所有天的通告紀錄都會一起移除。',
                confirmLabel: '刪除',
                danger: true,
              })
              if (ok) st().removeCast(c.id)
            }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}
    </Card>
  )
}
