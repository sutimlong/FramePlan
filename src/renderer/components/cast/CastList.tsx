import { Plus, Trash2, Upload } from 'lucide-react'
import { useProjectStore } from '@/store/useProjectStore'
import { Card, TextField } from '../common/Fields'
import { PhotoCropper } from '../common/PhotoCropper'
import { uid } from '@/lib/utils'
import type { ImageAsset } from '@shared/schema'

/** 共用演員名單：新增後，每一天都可以在「本日出勤」裡選用 */
export function CastList() {
  const cast = useProjectStore((s) => s.doc.cast)
  const st = useProjectStore.getState

  const handleImportCast = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string)
        const list = Array.isArray(data) ? data : (data.cast || data.actors || data.data || [])

        const newCasts = []
        for (const item of list) {
          let photoAssetId: string | undefined = undefined
          const photoData = item.standardPhotoUrl || item.photo || item.photoBase64 || item.image || item.photoData
          if (photoData) {
            const base64 = photoData.replace(/^data:image\/\w+;base64,/, '')
            const a: ImageAsset = { id: uid(), mime: 'image/jpeg', dataBase64: base64 }
            st().addAsset(a)
            photoAssetId = a.id
          }

          newCasts.push({
            characterName: item.name || item.characterName || item.role || item.character || '',
            actorName: item.realName || item.actorName || '',
            phone: item.contactPhone || item.phone || item.phoneNumber || '',
            email: item.email || '',
            photoAssetId,
          })
        }

        if (newCasts.length > 0) {
          st().addCasts(newCasts)
          st().showToast('info', `成功匯入 ${newCasts.length} 位演員`)
        } else {
          st().showToast('error', '找不到可匯入的演員資料')
        }
      } catch (err) {
        st().showToast('error', '無法解析 .cast 檔案格式，請確認是否為有效的 JSON。')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
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
            onClick={() => {
              if (window.confirm(`刪除「${c.characterName || c.actorName || '未命名'}」？所有天的通告紀錄都會一起移除。`)) {
                st().removeCast(c.id)
              }
            }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}
    </Card>
  )
}
